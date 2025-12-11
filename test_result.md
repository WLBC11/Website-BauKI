# Test Results

## Current Test: File Upload Feature

### Feature Description
- Users can upload images (JPEG, PNG, GIF, WebP) and PDF files
- Maximum file size: 25 MB
- 1 file per message
- Files are sent to N8N webhook as Base64
- Files remain visible in the conversation

### Backend Endpoint
- POST /api/chat/upload (multipart/form-data)
- Accepts: message, file, conversation_id, session_id

### Test Cases to Verify
1. Upload button visible in chat input
2. File type validation (only images and PDFs allowed)
3. File size validation (max 25 MB)
4. File preview shown before sending
5. File attachment displayed in sent messages
6. Backend correctly forwards file to N8N webhook
7. Error handling for invalid files

### Testing Status
- [ ] Backend endpoint tested
- [ ] Frontend UI tested
- [ ] File validation tested
- [ ] N8N integration tested (requires active N8N workflow)

### Notes
- N8N webhook must be active to receive file uploads
- User reported webhook is now working (Status 200)
