# Chat Application - Product Requirements Document

## Original Problem Statement
Build a full-stack chat application with N8N integration for AI responses, supporting file uploads (images, PDFs, audio), user authentication, and conversation management.

## User Personas
- **End Users**: German-speaking users seeking AI chat assistance
- **Administrators**: App owners monitoring usage and feedback

## Core Requirements
1. Real-time chat with AI via N8N webhook
2. Multi-file upload support (images, PDFs, audio)
3. User authentication (register, login, password reset)
4. Conversation history management
5. Admin dashboard with statistics

## Architecture
- **Frontend**: React with Shadcn/UI, pdf.js for PDF thumbnails
- **Backend**: FastAPI with MongoDB
- **Integration**: N8N webhook for AI responses

## What's Been Implemented

### December 2024 - January 2025
- ✅ Core chat functionality with N8N integration
- ✅ User authentication (JWT-based)
- ✅ Multi-file upload support
- ✅ PDF thumbnail generation (client-side with pdf.js)
- ✅ Clickable file previews in modal
- ✅ Admin dashboard with statistics
- ✅ Feedback system
- ✅ Bundesland selection for users

### January 10, 2025
- ✅ **File Upload Endpoint Refactored**: Changed from separate keys (`file`, `file2`, `file3`) to single `files` array for easier N8N looping

## Current Payload Structure (N8N)
```json
{
  "message": "...",
  "hasMessage": true/false,
  "aiInstruction": "...",
  "sessionId": "...",
  "conversationId": "...",
  "bundesland": "...",
  "fileCount": 3,
  "files": [
    { "name": "...", "type": "...", "fileType": "...", "data": "base64...", "size": 123 }
  ]
}
```

## Pending Verification
- [ ] "Open in new tab" link removal in ChatMessage.jsx modal

## Prioritized Backlog

### P0 - Critical
- Deployment blockers (unresolved from previous sessions)

### P1 - High Priority
- Freemium system with daily message limits
- Timer countdown when limit reached
- Stripe integration for subscriptions
- PayPal integration (optional)

### P2 - Medium Priority
- "Stop Generation" button bugs
- Rename/Delete modal verification
- Chat persistence in sidebar

### P3 - Low Priority
- PWA conversion
- Export chat feature
- Backend refactoring (split server.py)

## Technical Debt
- Full PDF base64 stored in React state (memory-intensive)
- ChatMessage.jsx and ChatInput.jsx contain modal logic that could be extracted
- server.py is large and could be split into modules

## Key Files
- `/app/backend/server.py` - Main backend
- `/app/frontend/src/context/ChatContext.js` - Chat state management
- `/app/frontend/src/components/ChatInput.jsx` - Message input with file upload
- `/app/frontend/src/components/ChatMessage.jsx` - Message display with file previews

## Credentials
- Register new users via UI
- Admin emails: weiss.jonathan1107@outlook.com, lukas.lust11@gmail.com
