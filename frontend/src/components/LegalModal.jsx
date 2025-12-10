import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FileText, Shield, ScrollText } from 'lucide-react';
import Impressum from './legal/Impressum';
import Datenschutz from './legal/Datenschutz';
import AGB from './legal/AGB';

const LegalModal = ({ isOpen, onClose }) => {
  const [impressumOpen, setImpressumOpen] = useState(false);
  const [datenschutzOpen, setDatenschutzOpen] = useState(false);
  const [agbOpen, setAgbOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Rechtliches</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            <button
              onClick={() => {
                onClose();
                setImpressumOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-[#3f3f3f] rounded-lg transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Impressum</span>
            </button>
            
            <button
              onClick={() => {
                onClose();
                setDatenschutzOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-[#3f3f3f] rounded-lg transition-colors"
            >
              <Shield className="h-5 w-5" />
              <span>Datenschutzerklärung</span>
            </button>
            
            <button
              onClick={() => {
                onClose();
                setAgbOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-[#3f3f3f] rounded-lg transition-colors"
            >
              <ScrollText className="h-5 w-5" />
              <span>AGB</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Legal Document Modals */}
      <Impressum isOpen={impressumOpen} onClose={() => setImpressumOpen(false)} />
      <Datenschutz isOpen={datenschutzOpen} onClose={() => setDatenschutzOpen(false)} />
      <AGB isOpen={agbOpen} onClose={() => setAgbOpen(false)} />
    </>
  );
};

export default LegalModal;
