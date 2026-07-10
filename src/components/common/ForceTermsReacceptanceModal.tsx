import React from 'react';
import { Scale, ShieldAlert, Check, RefreshCw, Lock } from 'lucide-react';
import { TermsDocument, logTermsAcceptance } from '../../data/termsUtils';

interface ForceTermsReacceptanceModalProps {
  document: TermsDocument;
  userEmail: string;
  userRole: string;
  onAccept: () => void;
}

export default function ForceTermsReacceptanceModal({ 
  document: doc, 
  userEmail, 
  userRole, 
  onAccept 
}: ForceTermsReacceptanceModalProps) {
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleAcceptAndContinue = () => {
    if (!agreed) return;
    setLoading(true);
    
    setTimeout(() => {
      try {
        logTermsAcceptance(
          userEmail,
          userEmail.split('@')[0],
          userRole,
          doc.version
        );
        onAccept();
      } catch (err) {
        console.error('Failed to log forced terms re-acceptance:', err);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4" id="force-reacceptance-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Banner header alert style */}
        <div className="bg-amber-500 text-white px-6 py-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4 animate-bounce" /> Action Required: Updated Terms of Service
        </div>

        {/* Modal Info Block */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Access Locked Until Acceptance</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We have recently updated our official compliance policies for <strong>{doc.title}</strong>. 
              As an active DoctSpark operator, you are required to review and explicitly accept these updated terms (Version {doc.version}) to restore dashboard access.
            </p>
          </div>
        </div>

        {/* Scrollable Document Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 space-y-4 max-h-[40vh] border-b border-slate-100 bg-white">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase block">Agreement Properties</span>
            <div className="grid grid-cols-2 gap-4 mt-2 text-[10px] font-medium text-slate-500 font-mono">
              <div>Document ID: <strong className="text-slate-800">{doc.id.toUpperCase()}</strong></div>
              <div>Published: <strong className="text-slate-800">{new Date(doc.updatedAt).toLocaleDateString()}</strong></div>
              <div>Latest Version: <strong className="text-slate-800">{doc.version}</strong></div>
              <div>Issuer: <strong className="text-slate-800">{doc.updatedBy}</strong></div>
            </div>
          </div>

          <div 
            dangerouslySetInnerHTML={{ __html: doc.content }} 
            className="prose prose-slate max-w-none text-xs leading-relaxed space-y-3 font-medium text-slate-600"
          />
        </div>

        {/* Dynamic Acceptance Consent Controls */}
        <div className="bg-slate-50 p-6 flex flex-col gap-4">
          <label className="flex items-start gap-3 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4.5 h-4.5 border-slate-300 transition-all"
            />
            <span className="leading-relaxed">
              I certify that I have read the updated agreement and hereby agree to follow the <strong>DoctSpark Terms of Service</strong>, updated compliance protocols, and standard platform values.
            </span>
          </label>

          <div className="flex justify-end gap-3 items-center pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleAcceptAndContinue}
              disabled={!agreed || loading}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                agreed && !loading 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-[0.98]' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-75'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Signatures...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Accept Terms & Unlock Dashboard
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
