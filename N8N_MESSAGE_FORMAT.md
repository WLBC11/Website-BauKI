# N8N Nachrichtenformat für BauKI Chat

## Übersicht
Das Frontend verarbeitet strukturierte JSON-Nachrichten von N8N.

## Nachrichtentypen

### 1. TEXT NACHRICHT
```json
{
  "type": "text",
  "text": "Dies ist die Antwort der KI"
}
```

### 2. BILD NACHRICHT
```json
{
  "type": "image",
  "imageUrl": "https://tempfile.aiquickdraw.com/images/xxxx.png"
}
```

## Implementierung im Frontend

### Parsing-Logik (ChatContext.js)
```javascript
// Die Antwort von N8N wird automatisch geparst
let responseData = response.data.response;

if (typeof responseData === 'string' && responseData.trim().startsWith('{')) {
  const parsed = JSON.parse(responseData);
  
  if (parsed.type === 'image') {
    // Zeige Bild
    messageType = 'image';
    imageUrl = parsed.imageUrl;
  } else if (parsed.type === 'text') {
    // Zeige Text
    messageType = 'text';
    messageContent = parsed.text;
  }
}
```

### Rendering (ChatMessage.jsx)
```jsx
{message.type === 'image' && message.imageUrl && (
  <img 
    src={message.imageUrl} 
    alt="KI generiertes Bild" 
    className="rounded-lg shadow-lg"
  />
)}

{displayedContent && (
  <ReactMarkdown>{displayedContent}</ReactMarkdown>
)}
```

## Features

### Für Bilder:
- ✅ Automatische Anzeige im Chat
- ✅ Klickbar für Vollbildansicht
- ✅ Download-Button (erscheint beim Hover)
- ✅ Responsive Darstellung
- ✅ Maximale Breite: 512px

### Für Text:
- ✅ Markdown-Unterstützung
- ✅ Typewriter-Animation
- ✅ Code-Highlighting
- ✅ LaTeX/Math-Rendering

## Fallback
Wenn die Antwort kein gültiges JSON ist, wird sie als normaler Text angezeigt.

## Beispiel N8N Workflow

### Für Textantworten:
```javascript
return {
  json: {
    type: "text",
    text: "Ihre KI-Antwort hier"
  }
};
```

### Für Bildantworten:
```javascript
return {
  json: {
    type: "image",
    imageUrl: "https://example.com/image.png"
  }
};
```
