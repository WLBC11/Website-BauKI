import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

const AGB = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Allgemeine Geschäftsbedingungen (AGB)</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-gray-300 text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Geltungsbereich</h2>
              <p className="leading-relaxed mb-3">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der 
                BauKI-Plattform (nachfolgend "Dienst" genannt), die von der PlanDirekt24 UG, 
                vertreten durch Jonathan Weiss, An der Hermannsquelle 12, 23879 Mölln 
                (nachfolgend "Anbieter" genannt) bereitgestellt wird.
              </p>
              <p className="leading-relaxed">
                Mit der Registrierung und Nutzung des Dienstes erkennen Sie diese AGB an.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. Leistungsbeschreibung</h2>
              <p className="leading-relaxed mb-3">
                BauKI ist eine KI-gestützte Plattform zur Beantwortung von Fragen rund um 
                Bauvorschriften, Baurecht und verwandte Themen. Der Dienst nutzt künstliche 
                Intelligenz (KI) zur Generierung von Antworten basierend auf Nutzerfragen.
              </p>
              <p className="leading-relaxed mb-3">
                <strong className="text-white">Kostenlose Nutzung:</strong> Der Dienst wird 
                derzeit kostenlos zur Verfügung gestellt. Der Anbieter behält sich vor, 
                zukünftig kostenpflichtige Premium-Funktionen einzuführen. Bestehende Nutzer 
                werden rechtzeitig über eventuelle Änderungen informiert.
              </p>
              <p className="leading-relaxed">
                Der Anbieter ist stets bemüht, den Dienst verfügbar zu halten, übernimmt jedoch 
                keine Garantie für eine ununterbrochene oder fehlerfreie Verfügbarkeit.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Registrierung und Nutzerkonto</h2>
              <p className="leading-relaxed mb-3">
                Zur Nutzung des Dienstes ist eine Registrierung erforderlich. Bei der 
                Registrierung müssen Sie wahrheitsgemäße und vollständige Angaben machen.
              </p>
              <p className="leading-relaxed mb-3">
                Sie sind verpflichtet, Ihre Zugangsdaten (E-Mail und Passwort) geheim zu halten 
                und vor dem Zugriff Dritter zu schützen. Bei Verdacht auf Missbrauch sind Sie 
                verpflichtet, uns umgehend zu informieren.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Altersgrenze:</strong> Es gibt keine Altersgrenze 
                für die Nutzung des Dienstes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Nutzungsrechte und -pflichten</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">4.1 Erlaubte Nutzung</h3>
              <p className="leading-relaxed mb-3">
                Sie dürfen den Dienst für private und gewerbliche Zwecke nutzen, soweit dies 
                rechtmäßig erfolgt und im Einklang mit diesen AGB steht.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">4.2 Verbotene Nutzung</h3>
              <p className="leading-relaxed mb-3">
                Folgende Handlungen sind untersagt:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li>Missbrauch des Dienstes für illegale Zwecke</li>
                <li>Verbreitung von schädlicher Software oder Viren</li>
                <li>Versuche, die Sicherheit des Systems zu kompromittieren</li>
                <li>Automatisierte Massenanfragen (ohne vorherige Genehmigung)</li>
                <li>Weitergabe oder Verkauf von Zugangsdaten</li>
                <li>Verstoß gegen geltendes Recht oder die Rechte Dritter</li>
              </ul>
              <p className="leading-relaxed">
                Bei Verstößen gegen diese Nutzungsbedingungen behält sich der Anbieter das Recht 
                vor, den Zugang zum Dienst zu sperren oder zu beenden.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Haftungsausschluss</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">5.1 Keine Haftung für KI-Inhalte</h3>
              <p className="leading-relaxed mb-3">
                <strong className="text-red-400">WICHTIG:</strong> Die durch die KI generierten 
                Antworten und Informationen dienen ausschließlich zu Informationszwecken. Der 
                Anbieter übernimmt keinerlei Gewähr für:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li>Die Richtigkeit der KI-generierten Inhalte</li>
                <li>Die Vollständigkeit der Informationen</li>
                <li>Die Aktualität der Informationen</li>
                <li>Die Anwendbarkeit auf Ihren konkreten Fall</li>
              </ul>
              <p className="leading-relaxed mb-3">
                Die KI-generierten Inhalte ersetzen <strong className="text-white">KEINE</strong> 
                professionelle Beratung durch qualifizierte Architekten, Ingenieure, Rechtsanwälte 
                oder andere Fachexperten. Bei wichtigen baulichen oder rechtlichen Entscheidungen 
                sollten Sie stets einen qualifizierten Fachmann konsultieren.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">5.2 Haftungsbeschränkung</h3>
              <p className="leading-relaxed mb-3">
                Der Anbieter haftet nicht für Schäden, die durch die Nutzung oder Nichtnutzung 
                des Dienstes entstehen, insbesondere nicht für:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                <li>Direkte oder indirekte Schäden aus der Nutzung der KI-Antworten</li>
                <li>Fehlentscheidungen aufgrund der bereitgestellten Informationen</li>
                <li>Datenverlust oder technische Störungen</li>
                <li>Unterbrechungen oder Nichtverfügbarkeit des Dienstes</li>
                <li>Schäden durch Dritte oder externe Dienste (z.B. OpenAI)</li>
              </ul>

              <h3 className="font-semibold text-white mt-4 mb-2">5.3 Gesetzliche Haftung</h3>
              <p className="leading-relaxed">
                Die Haftung bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, 
                Körper und Gesundheit bleibt unberührt. Die Haftung nach dem Produkthaftungsgesetz 
                bleibt ebenfalls unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Urheberrecht und geistiges Eigentum</h2>
              <p className="leading-relaxed mb-3">
                Alle Inhalte der Plattform (Design, Texte, Grafiken, Code) sind urheberrechtlich 
                geschützt und Eigentum des Anbieters oder seiner Lizenzgeber.
              </p>
              <p className="leading-relaxed">
                Die durch die KI generierten Antworten können Sie für Ihre eigenen Zwecke nutzen. 
                Eine Weiterverbreitung oder kommerzielle Nutzung der Plattform selbst ist ohne 
                vorherige schriftliche Genehmigung untersagt.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Datenschutz</h2>
              <p className="leading-relaxed">
                Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Details zur 
                Datenverarbeitung finden Sie in unserer separaten Datenschutzerklärung.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Kündigung und Kontolöschung</h2>
              <p className="leading-relaxed mb-3">
                Sie können Ihr Konto jederzeit und ohne Angabe von Gründen über die Einstellungen 
                löschen. Bei Löschung werden alle Ihre gespeicherten Daten (Konto, Chat-Verläufe) 
                unwiderruflich gelöscht.
              </p>
              <p className="leading-relaxed">
                Der Anbieter behält sich vor, bei Verstößen gegen diese AGB Nutzerkonten ohne 
                vorherige Ankündigung zu sperren oder zu löschen.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">9. Änderungen der AGB</h2>
              <p className="leading-relaxed">
                Der Anbieter behält sich das Recht vor, diese AGB jederzeit zu ändern. Nutzer 
                werden über wesentliche Änderungen per E-Mail oder durch einen Hinweis beim 
                Login informiert. Die Fortsetzung der Nutzung nach einer Änderung gilt als 
                Zustimmung zu den neuen AGB.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">10. Schlussbestimmungen</h2>
              <p className="leading-relaxed mb-3">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des 
                UN-Kaufrechts.
              </p>
              <p className="leading-relaxed mb-3">
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
                der übrigen Bestimmungen unberührt.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Kontakt bei Fragen:</strong><br />
                PlanDirekt24 UG<br />
                E-Mail: info@plandirekt24.de<br />
                Telefon: +49 171 1277531
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

export default AGB;
