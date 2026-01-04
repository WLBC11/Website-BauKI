from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
from passlib.context import CryptContext
import jwt
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# N8N Webhook URL
N8N_WEBHOOK_URL = os.environ['N8N_WEBHOOK_URL']

# Emergent LLM Key for title generation
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# JWT Settings
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    created_at: datetime
    bundesland: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Auth Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Get current user from JWT token, returns None if not authenticated"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id})
        return user
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Require authentication, raises 401 if not authenticated"""
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    return user


async def generate_chat_title(message: str) -> str:
    """Generate a short descriptive title for a chat based on the first message"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"title-{uuid.uuid4()}",
            system_message="Du bist ein Assistent, der extrem kurze Chat-Titel erstellt. Antworte NUR mit 1-3 kurzen Wörtern, die das Thema beschreiben. Maximale Länge: 20 Zeichen. Keine Anführungszeichen, keine Erklärungen."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=f"Erstelle einen extrem kurzen Titel (max. 20 Zeichen) für: {message[:200]}")
        title = await chat.send_message(user_message)
        
        # Clean up the title
        title = title.strip().strip('"').strip("'")
        if len(title) > 25:
            title = title[:22] + "..."
        
        return title
    except Exception as e:
        logger.error(f"Error generating title: {e}")
        # Fallback: use first 20 chars of message
        return message[:20] + ("..." if len(message) > 20 else "")


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
    title: Optional[str] = None

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    """Register a new user"""
    # Check if email already exists
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name or data.email.split("@")[0],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create token
    access_token = create_access_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            created_at=datetime.fromisoformat(user["created_at"]),
            bundesland=None
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ungültige E-Mail oder Passwort")
    
    access_token = create_access_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user.get("name"),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
            bundesland=user.get("bundesland")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(require_auth)):
    """Get current user info"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name"),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
        bundesland=user.get("bundesland")
    )


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/auth/change-password")
async def change_password(data: ChangePasswordRequest, user: dict = Depends(require_auth)):
    """Change user password"""
    # Verify current password
    # We need to fetch the full user with password hash (get_current_user returns it, but let's be safe)
    db_user = await db.users.find_one({"id": user["id"]})
    if not db_user or not verify_password(data.current_password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": new_hash}}
    )
    return {"message": "Passwort erfolgreich geändert"}

@api_router.delete("/auth/me")
async def delete_account(user: dict = Depends(require_auth)):
    """Delete current user account and all data"""
    user_id = user["id"]
    
    # Delete all conversations
    await db.conversations.delete_many({"user_id": user_id})
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "Konto erfolgreich gelöscht"}

class UpdateBundeslandRequest(BaseModel):
    bundesland: Optional[str] = None

@api_router.patch("/auth/bundesland")
async def update_bundesland(data: UpdateBundeslandRequest, user: dict = Depends(require_auth)):
    """Update user's bundesland preference"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"bundesland": data.bundesland}}
    )
    return {"success": True, "bundesland": data.bundesland}


class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

@api_router.post("/auth/request-password-reset")
async def request_password_reset(data: PasswordResetRequest):
    """Request a password reset - generates a 6-digit code"""
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        # Don't reveal if email exists - security best practice
        return {"message": "Wenn diese E-Mail registriert ist, wurde ein Reset-Code gesendet"}
    
    # Generate a 6-digit reset code
    reset_code = str(uuid.uuid4().int)[:6]
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Store reset code in database
    await db.password_resets.insert_one({
        "email": data.email.lower(),
        "reset_code": reset_code,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # In production, you would send this via email
    # For now, we return it (for testing purposes)
    logger.info(f"Password reset code for {data.email}: {reset_code}")
    
    return {
        "message": "Reset-Code wurde generiert",
        "reset_code": reset_code,  # In production, don't return this
        "note": "In Produktion würde dieser Code per E-Mail gesendet"
    }

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Reset password using the reset code"""
    # Find valid reset request
    reset_request = await db.password_resets.find_one({
        "email": data.email.lower(),
        "reset_code": data.reset_code
    })
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Ungültiger Reset-Code")
    
    # Check if expired
    expires_at = datetime.fromisoformat(reset_request["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        # Clean up expired code
        await db.password_resets.delete_one({"_id": reset_request["_id"]})
        raise HTTPException(status_code=400, detail="Reset-Code ist abgelaufen")
    
    # Update user password
    new_hash = hash_password(data.new_password)
    result = await db.users.update_one(
        {"email": data.email.lower()},
        {"$set": {"password_hash": new_hash}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Delete used reset code
    await db.password_resets.delete_one({"_id": reset_request["_id"]})
    
    return {"message": "Passwort erfolgreich zurückgesetzt"}

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
async def send_chat_message(request: ChatRequest, user: Optional[dict] = Depends(get_current_user)):
    """Send a message to N8N webhook and get a response"""
    try:
        # Generate or use existing conversation/session ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        session_id = request.session_id or conversation_id
        
        # Get bundesland from user account (not from request)
        user_bundesland = user.get("bundesland") if user else None
        
        # Prepare payload for N8N webhook
        payload = {
            "message": request.message,
            "sessionId": session_id,
            "conversationId": conversation_id,
            "bundesland": user_bundesland
        }
        
        logger.info(f"Sending message to N8N webhook: {request.message[:50]}...")
        
        # Call N8N webhook
        # Use global client
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
        
        # Get user_id if authenticated
        user_id = user["id"] if user else None
        
        if existing_conv:
            # Update existing conversation
            update_data = {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
            # If user is now logged in, associate the conversation with them
            if user_id and not existing_conv.get("user_id"):
                update_data["$set"]["user_id"] = user_id
            
            await db.conversations.update_one({"id": conversation_id}, update_data)
            response_title = existing_conv.get("title")
        else:
            # Create new conversation with AI-generated title
            generated_title = await generate_chat_title(request.message)
            new_conv = {
                "id": conversation_id,
                "user_id": user_id,  # None for guests, user_id for logged in users
                "title": generated_title,
                "messages": [user_msg, assistant_msg],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.conversations.insert_one(new_conv)
            response_title = generated_title
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            message_id=message_id,
            title=response_title
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


# File upload constants
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB per file
MAX_FILES = 5  # Maximum 5 files
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"]
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES + ["application/pdf"] + ALLOWED_AUDIO_TYPES


@api_router.post("/chat/upload", response_model=ChatResponse)
async def send_chat_with_files(
    message: str = Form(""),
    conversation_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    user: Optional[dict] = Depends(get_current_user)
):
    """Send a message with multiple files (images, PDFs, or audio) to N8N webhook"""
    try:
        # Validate number of files
        if len(files) > MAX_FILES:
            raise HTTPException(
                status_code=400,
                detail=f"Zu viele Dateien. Maximum: {MAX_FILES}"
            )
        
        processed_files = []
        
        for file in files:
            # Validate file type
            if file.content_type not in ALLOWED_FILE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Dateityp nicht erlaubt für '{file.filename}'. Erlaubt sind: Bilder (JPEG, PNG, GIF, WebP), PDF und Audio"
                )
            
            # Read file content
            file_content = await file.read()
            
            # Validate file size
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Datei '{file.filename}' zu groß. Maximum: {MAX_FILE_SIZE // (1024*1024)} MB"
                )
            
            # Convert to base64
            file_base64 = base64.b64encode(file_content).decode('utf-8')
            
            # Determine file type
            is_image = file.content_type in ALLOWED_IMAGE_TYPES
            is_audio = file.content_type in ALLOWED_AUDIO_TYPES
            if is_image:
                file_type = "image"
            elif is_audio:
                file_type = "audio"
            else:
                file_type = "pdf"
            
            processed_files.append({
                "name": file.filename,
                "type": file.content_type,
                "fileType": file_type,
                "data": file_base64,
                "size": len(file_content),
                "is_image": is_image,
                "is_audio": is_audio
            })
        
        # Generate or use existing conversation/session ID
        conv_id = conversation_id or str(uuid.uuid4())
        sess_id = session_id or conv_id
        
        # Get bundesland from user account
        user_bundesland = user.get("bundesland") if user else None
        
        # Determine overall file types for AI instruction
        has_images = any(f["is_image"] for f in processed_files)
        has_audio = any(f["is_audio"] for f in processed_files)
        has_pdfs = any(f["fileType"] == "pdf" for f in processed_files)
        
        # Prepare payload for N8N webhook with file data
        # If no message provided, add instruction for AI based on file types
        if not message.strip():
            if has_audio:
                ai_instruction = ""  # Audio will be transcribed by N8N, no instruction needed
            elif len(processed_files) == 1:
                if has_images:
                    ai_instruction = "Der Nutzer hat ein Bild gesendet ohne eine Nachricht. Frage den Nutzer freundlich, was er mit dem Bild machen möchte oder was seine Frage dazu ist."
                else:
                    ai_instruction = "Der Nutzer hat eine PDF-Datei gesendet ohne eine Nachricht. Frage den Nutzer freundlich, was er mit der Datei machen möchte oder welche Frage er dazu hat."
            else:
                file_types = []
                if has_images:
                    file_types.append("Bilder")
                if has_pdfs:
                    file_types.append("PDF-Dateien")
                ai_instruction = f"Der Nutzer hat {len(processed_files)} Dateien gesendet ({', '.join(file_types)}) ohne eine Nachricht. Frage den Nutzer freundlich, was er mit den Dateien machen möchte oder welche Frage er dazu hat."
        else:
            ai_instruction = ""
        
        # Build payload with files array
        payload = {
            "message": message,  # Can be empty string
            "hasMessage": bool(message.strip()),  # Flag to indicate if user provided a message
            "aiInstruction": ai_instruction,  # Instruction for AI when no message
            "sessionId": sess_id,
            "conversationId": conv_id,
            "bundesland": user_bundesland,
            "files": [{
                "name": f["name"],
                "type": f["type"],
                "fileType": f["fileType"],
                "data": f["data"],
                "size": f["size"]
            } for f in processed_files],
            # Keep single file for backwards compatibility
            "file": {
                "name": processed_files[0]["name"],
                "type": processed_files[0]["type"],
                "fileType": processed_files[0]["fileType"],
                "data": processed_files[0]["data"],
                "size": processed_files[0]["size"]
            } if len(processed_files) == 1 else None,
            "fileCount": len(processed_files)
        }
        
        log_message = message[:50] if message else f"({len(processed_files)} Dateien)"
        logger.info(f"Sending {len(processed_files)} file(s) to N8N webhook: {log_message}...")
        for f in processed_files:
            logger.info(f"File: {f['name']}, Type: {f['fileType']}, Size: {f['size']} bytes")
        
        # Call N8N webhook with longer timeout for file uploads
        response = await http_client.post(
            N8N_WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=180.0  # Extended timeout for multiple file processing
        )
        
        logger.info(f"N8N response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"N8N webhook error: {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"N8N webhook returned error: {response.status_code}"
            )
        
        # Parse response
        try:
            response_data = response.json()
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
        except Exception:
            ai_response = response.text
        
        message_id = str(uuid.uuid4())
        
        # Store file infos for display (only store metadata, not full base64 for large files)
        file_infos = []
        for f in processed_files:
            file_info = {
                "name": f["name"],
                "type": f["type"],
                "fileType": f["fileType"],
                "size": f["size"]
            }
            # For images, store a smaller preview (only for images under 500KB)
            if f["is_image"] and f["size"] <= 500 * 1024:
                file_info["preview"] = f["data"]
            file_infos.append(file_info)
        
        # Store conversation in database
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "files": file_infos  # Array of files
        }
        
        assistant_msg = {
            "id": message_id,
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if conversation exists
        existing_conv = await db.conversations.find_one({"id": conv_id})
        
        # Get user_id if authenticated
        user_id = user["id"] if user else None
        
        if existing_conv:
            update_data = {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
            if user_id and not existing_conv.get("user_id"):
                update_data["$set"]["user_id"] = user_id
            
            await db.conversations.update_one({"id": conv_id}, update_data)
            response_title = existing_conv.get("title")
        else:
            # Use filename for title if no message provided
            title_source = message if message.strip() else (processed_files[0]["name"] if len(processed_files) == 1 else f"{len(processed_files)} Dateien")
            generated_title = await generate_chat_title(title_source)
            new_conv = {
                "id": conv_id,
                "user_id": user_id,
                "title": generated_title,
                "messages": [user_msg, assistant_msg],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.conversations.insert_one(new_conv)
            response_title = generated_title
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conv_id,
            message_id=message_id,
            title=response_title
        )
        
    except httpx.TimeoutException as e:
        logger.error(f"N8N webhook timeout during file upload: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=504, detail="N8N webhook timeout - Dateien zu groß oder Server nicht erreichbar")
    except httpx.RequestError as e:
        logger.error(f"N8N webhook request error: {type(e).__name__} - {str(e)} - {repr(e)}")
        raise HTTPException(status_code=502, detail=f"Verbindung zu N8N fehlgeschlagen: {type(e).__name__}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat with file error: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(require_auth)):
    """Get all conversations for the logged-in user"""
    conversations = await db.conversations.find(
        {"user_id": user["id"]}, 
        {"_id": 0}
    ).sort("updated_at", -1).to_list(25)
    return conversations

@api_router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user: Optional[dict] = Depends(get_current_user)):
    """Get a specific conversation"""
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Check if user has access (either their conversation or guest conversation)
    if conversation.get("user_id") and (not user or conversation["user_id"] != user["id"]):
        raise HTTPException(status_code=403, detail="Zugriff verweigert")
    return conversation

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(require_auth)):
    """Delete a conversation"""
    # Only allow deleting own conversations
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Zugriff verweigert")
    
    await db.conversations.delete_one({"id": conversation_id})
    return {"message": "Conversation deleted"}


class ConversationUpdate(BaseModel):
    title: str


@api_router.patch("/conversations/{conversation_id}")
async def rename_conversation(conversation_id: str, update: ConversationUpdate, user: dict = Depends(require_auth)):
    """Rename a conversation"""
    # Only allow renaming own conversations
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Zugriff verweigert")
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"title": update.title, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Conversation renamed", "title": update.title}


@api_router.post("/conversations/claim")
async def claim_conversation(conversation_id: str, user: dict = Depends(require_auth)):
    """Claim a guest conversation for the logged-in user"""
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.get("user_id"):
        raise HTTPException(status_code=400, detail="Diese Unterhaltung gehört bereits einem Benutzer")
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"user_id": user["id"]}}
    )
    return {"message": "Conversation claimed successfully"}


# Feedback Models
class FeedbackCreate(BaseModel):
    message: str

class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    message: str
    created_at: datetime

# Feedback Routes
@api_router.post("/feedback")
async def create_feedback(data: FeedbackCreate, user: dict = Depends(require_auth)):
    """Create a new feedback message"""
    feedback_id = str(uuid.uuid4())
    feedback = {
        "id": feedback_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Unbekannt"),
        "user_email": user["email"],
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feedback.insert_one(feedback)
    
    # Keep only the 10 newest feedback messages
    total_feedback = await db.feedback.count_documents({})
    if total_feedback > 10:
        # Get all feedback sorted by created_at (oldest first)
        all_feedback = await db.feedback.find({}, {"_id": 0, "id": 1, "created_at": 1}).sort("created_at", 1).to_list(total_feedback)
        # Calculate how many to delete
        to_delete_count = total_feedback - 10
        # Get IDs of oldest feedback to delete
        ids_to_delete = [f["id"] for f in all_feedback[:to_delete_count]]
        # Delete them
        await db.feedback.delete_many({"id": {"$in": ids_to_delete}})
    
    return {"message": "Feedback erfolgreich gesendet", "id": feedback_id}


# Admin Routes
ADMIN_EMAILS = [
    "weiss.jonathan1107@outlook.com",
    "lukas.lust11@gmail.com"
]

async def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Require admin authentication"""
    if user["email"].lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin-Zugriff verweigert")
    return user

@api_router.get("/admin/feedback")
async def get_all_feedback(user: dict = Depends(require_admin)):
    """Get the 10 newest feedback messages (admin only)"""
    feedback_list = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return feedback_list

@api_router.delete("/admin/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str, user: dict = Depends(require_admin)):
    """Delete a feedback message (admin only)"""
    result = await db.feedback.delete_one({"id": feedback_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback nicht gefunden")
    return {"message": "Feedback gelöscht"}

@api_router.get("/admin/stats")
async def get_admin_stats(
    start_date: str,
    end_date: str,
    user: dict = Depends(require_admin)
):
    """Get admin statistics for the dashboard"""
    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Total users (all time)
        total_users = await db.users.count_documents({})
        
        # New users in period
        new_users_in_period = await db.users.count_documents({
            "created_at": {
                "$gte": start.isoformat(),
                "$lte": end.isoformat()
            }
        })
        
        # Active users today (who sent messages today)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        active_users_today = len(await db.conversations.distinct("user_id", {
            "user_id": {"$ne": None},
            "updated_at": {"$gte": today_start.isoformat()}
        }))
        
        # Active users in period (who sent messages in period)
        active_users_in_period = len(await db.conversations.distinct("user_id", {
            "user_id": {"$ne": None},
            "updated_at": {
                "$gte": start.isoformat(),
                "$lte": end.isoformat()
            }
        }))
        
        # Total conversations and messages
        total_conversations = await db.conversations.count_documents({})
        
        # Count total messages
        pipeline = [
            {"$project": {"message_count": {"$size": "$messages"}}},
            {"$group": {"_id": None, "total": {"$sum": "$message_count"}}}
        ]
        message_result = await db.conversations.aggregate(pipeline).to_list(1)
        total_messages = message_result[0]["total"] if message_result else 0
        
        # Average messages per chat
        avg_messages_per_chat = total_messages / total_conversations if total_conversations > 0 else 0
        
        # Users with chats
        users_with_chats = len(await db.conversations.distinct("user_id", {"user_id": {"$ne": None}}))
        
        # Top Bundesländer
        bundesland_pipeline = [
            {"$match": {"bundesland": {"$ne": None}}},
            {"$group": {"_id": "$bundesland", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_bundeslaender = await db.users.aggregate(bundesland_pipeline).to_list(5)
        top_bundeslaender = [{"bundesland": item["_id"], "count": item["count"]} for item in top_bundeslaender]
        
        # Chart data - daily breakdown
        from datetime import timedelta
        
        chart_data = []
        current_date = start
        
        while current_date <= end:
            day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # New users on this day
            new_users = await db.users.count_documents({
                "created_at": {
                    "$gte": day_start.isoformat(),
                    "$lt": day_end.isoformat()
                }
            })
            
            # Active users on this day
            active_users = len(await db.conversations.distinct("user_id", {
                "user_id": {"$ne": None},
                "updated_at": {
                    "$gte": day_start.isoformat(),
                    "$lt": day_end.isoformat()
                }
            }))
            
            chart_data.append({
                "date": current_date.strftime("%d.%m"),
                "new_users": new_users,
                "active_users": active_users
            })
            
            current_date += timedelta(days=1)
        
        return {
            "total_users": total_users,
            "new_users_in_period": new_users_in_period,
            "active_users_today": active_users_today,
            "active_users_in_period": active_users_in_period,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "avg_messages_per_chat": round(avg_messages_per_chat, 1),
            "users_with_chats": users_with_chats,
            "top_bundeslaender": top_bundeslaender,
            "chart_data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Admin stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

http_client = None

@app.on_event("startup")
async def startup_event():
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=30.0))  # 5 Minuten für KI-Antworten, 30 Sek. für Verbindung

@app.on_event("shutdown")
async def shutdown_event():
    global http_client
    if http_client:
        await http_client.aclose()
    client.close()