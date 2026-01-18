# Image Proxy Feature

## Übersicht
Der Image-Proxy-Endpunkt wurde implementiert, um CORS-Probleme mit externen Bild-URLs (insbesondere von tempfile.aiquickdraw.com) zu umgehen.

## Backend-Implementierung

### Endpoint
```
GET /api/image-proxy?url=<encoded_image_url>
```

### Features
1. **Proxy-Funktionalität**: Lädt Bilder serverseitig und liefert sie mit korrektem Content-Type
2. **Redirect-Unterstützung**: Folgt automatisch HTTP-Redirects (z.B. 302)
3. **In-Memory Cache**: Speichert Bilder für 5 Minuten, um redundante Requests zu vermeiden
4. **Error Handling**: Gibt aussagekräftige Fehlermeldungen bei Problemen zurück

### Technische Details
- **Bibliothek**: httpx (async HTTP client)
- **Cache-TTL**: 300 Sekunden (5 Minuten)
- **Timeout**: 30 Sekunden für externe Requests
- **Response**: Direkter Binary-Stream mit originalem Content-Type

### Cache-Struktur
```python
image_cache = {
    "url": (image_bytes, content_type, timestamp)
}
```

### Fehlerbehandlung
- **400**: URL-Parameter fehlt
- **502**: Fehler beim Abrufen des externen Bildes
- **500**: Interner Serverfehler

## Frontend-Integration

### Automatische URL-Umleitung
Alle `imageUrl` Werte aus N8N-Responses werden automatisch über den Proxy geleitet:

```javascript
// In ChatContext.js
if (parsed.type === 'image' && parsed.imageUrl) {
  imageUrl = `${API}/image-proxy?url=${encodeURIComponent(parsed.imageUrl)}`;
}
```

### Vorteile
- ✅ Keine CORS-Probleme mehr
- ✅ Schnellere Ladezeiten durch Cache
- ✅ Einheitliche Error-Handling
- ✅ Keine Änderungen am N8N-Workflow nötig

## Performance
- **Initial Fetch**: ~400-500ms (abhängig von externer Quelle)
- **Cached Fetch**: ~40-50ms (10x schneller)
- **Cache-Gültigkeit**: 5 Minuten

## Logging
Der Proxy loggt alle Aktivitäten:
- `Fetching image from URL: <url>` - Neuer Download
- `Cached image for URL: <url>` - Erfolgreich gecacht
- `Serving cached image for URL: <url>` - Aus Cache geladen
- `Failed to fetch image from <url>` - Fehler beim Download

## Testing
```bash
# Test mit curl
curl "http://localhost:8001/api/image-proxy?url=https://picsum.photos/512/512" -o test.png

# Test mit Cache
curl "http://localhost:8001/api/image-proxy?url=https://picsum.photos/512/512" -o test1.png
curl "http://localhost:8001/api/image-proxy?url=https://picsum.photos/512/512" -o test2.png
# Zweiter Request sollte deutlich schneller sein
```

## Sicherheit
- **URL-Validierung**: Prüft auf gültige URL-Parameter
- **Timeout**: Verhindert hängende Requests
- **Error-Handling**: Gibt keine sensiblen Informationen preis

## Zukünftige Verbesserungen
- [ ] Persistenter Cache (Redis/Memcached)
- [ ] Bildgröße-Limits
- [ ] Whitelist für erlaubte Domains
- [ ] Compression für große Bilder
