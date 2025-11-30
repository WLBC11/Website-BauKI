from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# N8N Webhook URL
N8N_WEBHOOK_URL = os.environ.get('N8N_WEBHOOK_URL', 'https://n8n.srv1066219.hstgr.cloud/webhook/websitetest')

# Emergent LLM Key for title generation
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


async def generate_chat_title(message: str) -> str:
    """Generate a short descriptive title for a chat based on the first message"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"title-{uuid.uuid4()}",
            system_message="Du bist ein Assistent, der kurze Chat-Titel erstellt. Antworte NUR mit einem kurzen Titel (2-5 Wörter), der das Thema der Nachricht beschreibt. Keine Anführungszeichen, keine Erklärungen."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Erstelle einen kurzen Titel für diese Nachricht: {message[:200]}")
        title = await chat.send_message(user_message)
        
        # Clean up the title
        title = title.strip().strip('"').strip("'")
        if len(title) > 50:
            title = title[:47] + "..."
        
        return title
    except Exception as e:
        logger.error(f"Error generating title: {e}")
        # Fallback: use first 30 chars of message
        return message[:30] + ("..." if len(message) > 30 else "")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Chat Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    message_id: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Chat endpoints
@api_router.post("/chat", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    """Send a message to N8N webhook and get a response"""
    try:
        # Generate or use existing conversation/session ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        session_id = request.session_id or conversation_id
        
        # Prepare payload for N8N webhook
        payload = {
            "message": request.message,
            "sessionId": session_id,
            "conversationId": conversation_id
        }
        
        logger.info(f"Sending message to N8N webhook: {request.message[:50]}...")
        
        # Call N8N webhook
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            response = await http_client.post(
                N8N_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            logger.info(f"N8N response status: {response.status_code}")
            logger.info(f"N8N response body: {response.text[:500]}")
            
            if response.status_code != 200:
                logger.error(f"N8N webhook error: {response.text}")
                raise HTTPException(
                    status_code=502,
                    detail=f"N8N webhook returned error: {response.status_code}"
                )
            
            # Parse response - handle different possible formats
            try:
                response_data = response.json()
                
                # Try different response formats
                if isinstance(response_data, str):
                    ai_response = response_data
                elif isinstance(response_data, dict):
                    ai_response = (
                        response_data.get('response') or 
                        response_data.get('output') or 
                        response_data.get('message') or 
                        response_data.get('text') or
                        response_data.get('answer') or
                        str(response_data)
                    )
                elif isinstance(response_data, list) and len(response_data) > 0:
                    first_item = response_data[0]
                    if isinstance(first_item, str):
                        ai_response = first_item
                    elif isinstance(first_item, dict):
                        ai_response = (
                            first_item.get('response') or 
                            first_item.get('output') or 
                            first_item.get('message') or 
                            first_item.get('text') or
                            first_item.get('answer') or
                            str(first_item)
                        )
                    else:
                        ai_response = str(first_item)
                else:
                    ai_response = str(response_data)
                    
            except Exception as json_err:
                # If not JSON, use plain text
                ai_response = response.text
        
        message_id = str(uuid.uuid4())
        
        # Store conversation in database
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        assistant_msg = {
            "id": message_id,
            "role": "assistant", 
            "content": ai_response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if conversation exists
        existing_conv = await db.conversations.find_one({"id": conversation_id})
        
        if existing_conv:
            # Update existing conversation
            await db.conversations.update_one(
                {"id": conversation_id},
                {
                    "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                    "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                }
            )
        else:
            # Create new conversation with AI-generated title
            generated_title = await generate_chat_title(request.message)
            new_conv = {
                "id": conversation_id,
                "title": generated_title,
                "messages": [user_msg, assistant_msg],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.conversations.insert_one(new_conv)
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            message_id=message_id
        )
        
    except httpx.TimeoutException:
        logger.error("N8N webhook timeout")
        raise HTTPException(status_code=504, detail="N8N webhook timeout")
    except httpx.RequestError as e:
        logger.error(f"N8N webhook request error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to N8N: {str(e)}")
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/conversations")
async def get_conversations():
    """Get all conversations"""
    conversations = await db.conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return conversations

@api_router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation"""
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    result = await db.conversations.delete_one({"id": conversation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()