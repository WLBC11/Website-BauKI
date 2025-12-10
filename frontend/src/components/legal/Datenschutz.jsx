import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

const Datenschutz = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Datenschutzerklärung</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-gray-300 text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">Allgemeine Hinweise</h3>
              <p className="leading-relaxed mb-3">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">Wer ist verantwortlich für die Datenerfassung?</h3>
              <p className="leading-relaxed">
                <strong className="text-white">Verantwortlicher:</strong><br />
                PlanDirekt24 UG<br />
                Jonathan Weiss<br />
                An der Hermannsquelle 12<br />
                23879 Mölln, Deutschland<br />
                E-Mail: info@plandirekt24.de<br />
                Telefon: +49 171 1277531
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. Welche Daten erfassen wir?</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">Registrierungs- und Kontodaten</h3>
              <p className="leading-relaxed mb-3">
                Bei der Registrierung erfassen wir:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li>E-Mail-Adresse</li>
                <li>Passwort (verschlüsselt gespeichert)</li>
                <li>Name (optional)</li>
                <li>Ausgewähltes Bundesland (für landesspezifische Bauvorschriften)</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">Nutzungsdaten</h3>
              <p className="leading-relaxed mb-3">
                Während der Nutzung der BauKI speichern wir:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li>Chat-Verläufe und Konversationen</li>
                <li>Zeitstempel der Nachrichten</li>
                <li>Ihre Anfragen an die KI</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">Technische Daten</h3>
              <p className="leading-relaxed">
                Unser Server erfasst automatisch technische Informationen wie:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>IP-Adresse</li>
                <li>Browser-Typ und Version</li>
                <li>Betriebssystem</li>
                <li>Zugriffszeitpunkt</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Wie nutzen wir Ihre Daten?</h2>
              <p className="leading-relaxed mb-3">
                Wir verarbeiten Ihre Daten ausschließlich zu folgenden Zwecken:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Bereitstellung und Betrieb der BauKI-Plattform</li>
                <li>Speicherung und Verwaltung Ihrer Chat-Verläufe</li>
                <li>Personalisierung der Antworten basierend auf Ihrem Bundesland</li>
                <li>Verbesserung unserer Dienste</li>
                <li>Technische Administration und Sicherheit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Weitergabe von Daten an Dritte</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">KI-Dienste (OpenAI)</h3>
              <p className="leading-relaxed mb-3">
                Ihre Chat-Anfragen werden zur Verarbeitung an OpenAI übermittelt. OpenAI verarbeitet 
                diese Daten gemäß ihrer eigenen Datenschutzrichtlinien. Die Datenverarbeitung erfolgt 
                auf Basis eines Auftragsverarbeitungsvertrags und entsprechender 
                Standardvertragsklauseln für die Übermittlung in die USA.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">N8N Webhook-Service</h3>
              <p className="leading-relaxed mb-3">
                Wir nutzen N8N als Workflow-Automatisierung zur Verarbeitung Ihrer Anfragen. 
                Die Daten werden dabei ausschließlich zur Weiterleitung an die KI-Dienste verwendet.
              </p>

              <p className="leading-relaxed">
                <strong className="text-white">Wichtig:</strong> Wir geben Ihre Daten nicht zu 
                Werbezwecken an Dritte weiter.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Speicherdauer</h2>
              <p className="leading-relaxed mb-3">
                Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die Erfüllung 
                der genannten Zwecke erforderlich ist:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Kontodaten: Bis zur Löschung Ihres Kontos</li>
                <li>Chat-Verläufe: Bis zur Löschung durch Sie oder Ihres Kontos</li>
                <li>Technische Logs: Maximal 30 Tage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Ihre Rechte</h2>
              <p className="leading-relaxed mb-3">
                Sie haben jederzeit das Recht auf:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li><strong className="text-white">Auskunft:</strong> Information über Ihre gespeicherten Daten</li>
                <li><strong className="text-white">Berichtigung:</strong> Korrektur falscher Daten</li>
                <li><strong className="text-white">Löschung:</strong> Vollständige Löschung Ihres Kontos und aller Daten über die Einstellungen</li>
                <li><strong className="text-white">Einschränkung:</strong> Einschränkung der Verarbeitung</li>
                <li><strong className="text-white">Datenübertragbarkeit:</strong> Übertragung Ihrer Daten an einen anderen Anbieter</li>
                <li><strong className="text-white">Widerspruch:</strong> Widerspruch gegen die Verarbeitung</li>
                <li><strong className="text-white">Beschwerde:</strong> Beschwerde bei der zuständigen Aufsichtsbehörde</li>
              </ul>
              <p className="leading-relaxed">
                Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: info@plandirekt24.de
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Datensicherheit</h2>
              <p className="leading-relaxed mb-3">
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten 
                gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder Zugriff 
                unberechtigter Personen zu schützen:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Verschlüsselte Übertragung (HTTPS)</li>
                <li>Passwörter werden mit bcrypt gehasht</li>
                <li>Sichere Datenbank-Zugriffe</li>
                <li>Regelmäßige Sicherheitsupdates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
              <p className="leading-relaxed">
                Wir verwenden ausschließlich technisch notwendige Cookies zur Speicherung Ihrer 
                Sitzung (Login-Token). Diese Cookies sind erforderlich, damit Sie die BauKI nutzen 
                können. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">9. Änderungen der Datenschutzerklärung</h2>
              <p className="leading-relaxed">
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte 
                Rechtslagen oder Änderungen unserer Dienste anzupassen. Die aktuelle Version finden 
                Sie stets in den Einstellungen der App.
              </p>
            </section>

            <section className="text-xs text-gray-400 mt-6">
              <p>Stand: Dezember 2024</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Datenschutz;
