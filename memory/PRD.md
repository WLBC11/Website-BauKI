# BauKI - Product Requirements Document

## Original Problem Statement
BauKI ist eine Full-Stack Chat-Anwendung für Baurecht-Beratung mit KI-Unterstützung. Die App ermöglicht Benutzern, Fragen zu Bauvorschriften zu stellen, Dateien (Bilder, PDFs) hochzuladen, und Sprachnachrichten zu senden.

**Benutzersprache:** Deutsch

## Core Features (Implemented)
- [x] Chat-Interface mit KI-Antworten
- [x] Datei-Upload (Bilder, PDFs) mit Vorschau
- [x] Multi-File Upload zu N8N Webhook (multipart/form-data)
- [x] Sprachnachrichten-Aufnahme und Senden
- [x] PDF-Thumbnail-Generierung
- [x] Benutzer-Authentifizierung
- [x] Chat-Verlauf (für angemeldete Benutzer)

## Recent Changes (January 2025)

### 2025-01-12
- **Bug Fix:** Audio-Aufnahme Abbrechen-Button
  - Problem: Abbrechen-Button sendete Nachricht statt zu löschen
  - Lösung: Separate `cancelRecording()` Funktion implementiert
  - Zwei Buttons im Recording-Indicator: "Abbrechen" und "Senden"
  - Mikrofon-Button bricht während Aufnahme beim Klicken ab

### Previous Session
- N8N Multi-File Upload auf `multipart/form-data` umgestellt
- Status: Verifizierung durch Benutzer ausstehend

## Architecture

```
/app
├── backend/
│   └── server.py         # FastAPI Backend (monolithisch)
└── frontend/
    └── src/
        ├── components/
        │   ├── ChatInput.jsx    # Chat-Eingabe mit Datei-Upload, Sprachaufnahme
        │   └── ChatMessage.jsx  # Nachrichtenanzeige
        └── context/
            └── ChatContext.js   # Chat-State-Management
```

## 3rd Party Integrations
- **N8N Webhook:** Datei-Verarbeitung (multipart/form-data)
- **pdf.js:** Client-side PDF-Vorschau

## Pending Issues (P0-P3)

### P0 - Critical
- N8N Binary File Upload Verifizierung (Benutzer-Test ausstehend)

### P2 - Medium
- "Open in new tab" Link-Entfernung verifizieren
- N8N Datenstruktur für Multi-File Uploads optimieren

### P3 - Low
- LaTeX-Implementierung testen
- Deployment Blocker beheben
- Rename/Delete Modal Funktionalität
- "Stop Generation" Feature Bugs
- Chat-Persistenz/Sidebar-Issue

## Upcoming Tasks

### P0 - Subscription System
1. Stripe Integration (Karte/Bank/Apple Pay)
2. PayPal Subscriptions API
3. Backend-Logik für tägliche Nutzungslimits
4. Frontend UI für Limits und Countdown-Timer

### P1 - PWA Conversion
- App auf Mobilgeräten installierbar machen

### P2 - Export Chat Feature
- Chat-Verlauf exportieren

### P3 - Backend Refactoring
- `server.py` aufteilen in Routes, Services, Models

## Technical Debt
- `server.py` ist monolithisch (alle Backend-Logik in einer Datei)
- Memory-intensive Base64 PDF-Speicherung in ChatContext.js

## Credentials
- Stripe Test-Keys: Verfügbar in Pod-Environment
- PayPal Sandbox: Benötigt Benutzer-Credentials
