# Bildbearbeitungsfunktion

## Übersicht
Die Bildbearbeitungsfunktion ermöglicht Nutzern, zwischen zwei Modi für Bildverarbeitung zu wechseln:
- **Bildanalyse** (Standard): Bilder werden nur analysiert/beschrieben
- **Bildbearbeitung**: Bilder werden gemäß Nutzeranweisungen bearbeitet

## UI-Komponenten

### Toggle-Button
- **Position**: Zweiter Button von links in der Eingabeleiste (zwischen Büroklammer und Gesetzesbuch)
- **Icon**: Wand2 (Zauberstab) von lucide-react
- **Farben**:
  - Inaktiv: Grau (`bg-[#3f3f3f]`)
  - Aktiv: Grün (`bg-green-500/30`)
- **Tooltip**: 
  - Inaktiv: "Bildbearbeitung aktivieren"
  - Aktiv: "Bildbearbeitung aktiv - Bilder werden bearbeitet"

## Funktionsweise

### Modus: Bildanalyse (Standard)
```
Toggle: AUS (grau)
- Nutzer kann Bild hochladen
- Text ist optional
- Bild wird NUR analysiert/beschrieben
- KEIN action-Feld wird gesendet
```

### Modus: Bildbearbeitung
```
Toggle: AN (grün)
- Nutzer MUSS ein Bild hochladen
- Nutzer MUSS Text eingeben (Beschreibung der gewünschten Änderungen)
- Beim Absenden wird action = "edit_image" gesendet
```

## Validierung

### Fehlerfall: Bildbearbeitung ohne Text
Wenn der Nutzer bei aktiviertem Toggle versucht, ein Bild ohne Text zu senden:
```
Fehlermeldung: "Bitte beschreiben Sie, wie das Bild bearbeitet werden soll"
Nachricht wird NICHT gesendet
```

## Backend-Integration

### Request-Format
```javascript
// FormData wird an /api/chat/upload gesendet
formData.append('message', 'Mach das Bild heller');
formData.append('files', imageFile);
formData.append('conversation_id', conversationId);
formData.append('session_id', sessionId);
formData.append('action', 'edit_image'); // NUR wenn Toggle aktiv
```

### Backend-Verhalten
```python
if action == "edit_image":
    # Bildbearbeitungs-KI wird verwendet
    # Nutzer-Text wird als Anweisung interpretiert
else:
    # Standard-Bildanalyse
    # Bild wird beschrieben
```

## Implementierung

### Dateien
1. **Frontend**: `/app/frontend/src/components/ChatInput.jsx`
   - State: `isImageEditMode`
   - Toggle-Funktion: `toggleImageEditMode()`
   - Validierung: `handleSubmit()`

2. **Context**: `/app/frontend/src/context/ChatContext.js`
   - Funktion: `sendMessageWithFiles(content, files, action)`
   - Fügt `action` zu FormData hinzu

### Code-Beispiele

#### Toggle-State
```javascript
const [isImageEditMode, setIsImageEditMode] = useState(false);

const toggleImageEditMode = () => {
  setIsImageEditMode(prev => !prev);
  setFileError(null);
};
```

#### Validierung
```javascript
const hasImageFiles = selectedFiles.some(f => f.type?.startsWith('image/'));

if (isImageEditMode && hasImageFiles && !hasMessage) {
  setFileError('Bitte beschreiben Sie, wie das Bild bearbeitet werden soll');
  return;
}
```

#### Backend-Request
```javascript
const actionMode = isImageEditMode && hasImageFiles ? 'edit_image' : undefined;
await sendMessageWithFiles(messageToSend, filesToSend, actionMode);
```

## Testing

### Test-Szenarien
1. ✅ Toggle-Button wechselt zwischen grau und grün
2. ✅ Standardmodus: Bild ohne Text sendbar
3. ✅ Bildbearbeitung: Fehlermeldung bei fehlendem Text
4. ✅ Bildbearbeitung: Erfolgreicher Versand mit Text
5. ✅ Backend erhält `action="edit_image"` korrekt
6. ✅ Tooltip zeigt korrekten Status

### Getestet am
- Datum: 2025-01-17
- Status: ✅ Alle Tests bestanden
- Test-Report: `/app/test_result.md` (Zeile 268-330)

## Nutzer-Workflow

### Beispiel 1: Bildanalyse
```
1. Nutzer lädt Bild hoch
2. Optional: Fügt Frage hinzu ("Was ist auf dem Bild?")
3. Klickt Senden
→ KI analysiert und beschreibt das Bild
```

### Beispiel 2: Bildbearbeitung
```
1. Nutzer klickt auf Zauberstab-Button (wird grün)
2. Lädt Bild hoch
3. Gibt Anweisung ein ("Mach das Bild heller und schärfer")
4. Klickt Senden
→ KI bearbeitet das Bild gemäß Anweisung
```

## Technische Details

### States
```javascript
isImageEditMode: boolean  // Toggle-Status
fileError: string | null  // Validierungsfehler
```

### Props
```javascript
sendMessageWithFiles(
  content: string,
  files: File[],
  action?: 'edit_image' | undefined
)
```

### CSS-Klassen
```css
/* Inaktiv */
bg-[#3f3f3f] hover:bg-[#4f4f4f]
text-gray-300 opacity-70

/* Aktiv */
bg-green-500/30 hover:bg-green-500/40
text-green-400 opacity-100
```

## Kompatibilität
- Keine Auswirkung auf bestehende Chat-Funktionen
- PDF-Upload wird NICHT von Bildbearbeitung beeinflusst
- Nur für Bild-Dateien (JPEG, PNG, GIF, WebP) relevant
- Sprachnachrichten bleiben unberührt
