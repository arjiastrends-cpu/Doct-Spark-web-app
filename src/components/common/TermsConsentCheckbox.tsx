import React from 'react';
import { FileText, ShieldAlert, X, Printer, Download, Scale } from 'lucide-react';
import { getTermsDocuments, TermsDocument } from '../../data/termsUtils';

interface TermsConsentCheckboxProps {
  documentId: 'patient' | 'doctor' | 'clinic' | 'physiotherapy' | 'pharmacy' | 'partner' | 'laboratory';
  isAccepted: boolean;
  onChange: (value: boolean) => void;
}

export default function TermsConsentCheckbox({ documentId, isAccepted, onChange }: TermsConsentCheckboxProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [doc, setDoc] = React.useState<TermsDocument | null>(null);

  React.useEffect(() => {
    const docs = getTermsDocuments();
    const found = docs.find(d => d.id === documentId);
    if (found) {
      setDoc(found);
    }
  }, [documentId]);

  const handlePrint = () => {
    if (!doc) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${doc.title} - Version ${doc.version}</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 40px; color: #1a202c; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 24px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
              h2 { font-size: 18px; font-weight: 700; margin-top: 30px; margin-bottom: 10px; color: #2d3748; }
              ul, ol { padding-left: 20px; margin-bottom: 20px; }
              li { margin-bottom: 5px; }
              p { margin-bottom: 15px; text-align: justify; }
              .meta { font-size: 11px; color: #718096; margin-bottom: 30px; font-family: monospace; }
            </style>
          </head>
          <body>
            <h1>${doc.title}</h1>
            <div class="meta">
              Document Reference: ${doc.id.toUpperCase()}_TERMS_V${doc.version}<br>
              Effective Date: ${new Date(doc.updatedAt).toLocaleDateString()}<br>
              Status: Active Official Compliant
            </div>
            <div>${doc.content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-2 mt-3" id={`terms-consent-container-${documentId}`}>
      {/* Accept terms Checkbox */}
      <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-500 cursor-pointer select-none">
        <input 
          type="checkbox"
          checked={isAccepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4.5 h-4.5 border-slate-300 transition-all"
        />
        <span className="leading-relaxed">
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
            className="text-indigo-600 hover:text-indigo-700 underline font-black font-sans cursor-pointer focus:outline-none"
          >
            Terms & Conditions
          </button>{' '}
          and Privacy Policy of DoctSpark.
        </span>
      </label>

      {/* Modal Popup for terms document details */}
      {showModal && doc && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{doc.title}</h3>
                  <span className="text-[10px] text-indigo-600 font-extrabold uppercase font-mono">
                    Official Version {doc.version} • Effective: {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Terms Body */}
            <div className="p-6 overflow-y-auto flex-1 prose prose-slate max-w-none text-xs leading-relaxed text-slate-600 space-y-4">
              <div 
                dangerouslySetInnerHTML={{ __html: doc.content }} 
                className="space-y-3 whitespace-normal font-medium text-slate-700"
              />
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-black text-[10px] py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Agreement
                </button>
                <button
                  type="button"
                  onClick={() => alert('Download of latest T&C agreement PDF initiated.')}
                  className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-black text-[10px] py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Offline PDF
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onChange(true);
                    setShowModal(false);
                  }}
                  className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Accept Terms & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
