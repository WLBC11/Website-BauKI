import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

const Impressum = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Impressum</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-gray-300 text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Angaben gemäß § 5 TMG</h2>
              <p className="leading-relaxed">
                <strong className="text-white">PlanDirekt24 UG</strong><br />
                An der Hermannsquelle 12<br />
                23879 Mölln<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Vertreten durch</h2>
              <p className="leading-relaxed">
                Jonathan Weiss<br />
                Geschäftsführer
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Kontakt</h2>
              <p className="leading-relaxed">
                <strong className="text-white">Telefon:</strong> +49 171 1277531<br />
                <strong className="text-white">E-Mail:</strong> info@plandirekt24.de
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Haftungsausschluss</h2>
              
              <h3 className="font-semibold text-white mt-4 mb-2">Haftung für Inhalte</h3>
              <p className="leading-relaxed mb-3">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                Tätigkeit hinweisen.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">Haftung für KI-generierte Inhalte</h3>
              <p className="leading-relaxed mb-3">
                Die BauKI nutzt künstliche Intelligenz zur Beantwortung von Fragen. Wir übernehmen 
                keinerlei Haftung für die Richtigkeit, Vollständigkeit oder Verwendbarkeit der durch 
                die KI generierten Antworten. Die Nutzung der bereitgestellten Informationen erfolgt 
                auf eigene Verantwortung des Nutzers. Es wird empfohlen, wichtige Entscheidungen stets 
                von qualifizierten Fachleuten prüfen zu lassen.
              </p>

              <h3 className="font-semibold text-white mt-4 mb-2">Haftung für Links</h3>
              <p className="leading-relaxed">
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir 
                keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr 
                übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter 
                oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Urheberrecht</h2>
              <p className="leading-relaxed">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
                unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung 
                und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der 
                schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Datenschutz</h2>
              <p className="leading-relaxed">
                Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten 
                möglich. Soweit auf unseren Seiten personenbezogene Daten erhoben werden, erfolgt 
                dies stets auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche 
                Zustimmung nicht an Dritte weitergegeben. Weitere Informationen finden Sie in unserer 
                Datenschutzerklärung.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Impressum;
