import React from 'react';
import { Scale, ShieldAlert, Check, RefreshCw, Lock } from 'lucide-react';
import { TermsDocument, logTermsAcceptance } from '../../data/termsUtils';
import { supabase } from '../../lib/supabase';

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

  const handleAcceptAndContinue = async () => {
    if (!agreed) return;
    setLoading(true);
    
    console.log('Starting Patient Terms Acceptance workflow...');
    console.log('User email:', userEmail);
    console.log('User role:', userRole);
    console.log('Latest published version:', doc.version);
    
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
      
      if (hasSupabase && userRole === 'patient') {
        console.log('Supabase is configured. Attempting to get auth user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Failed to get authenticated user session: ' + (userError?.message || 'No user session found.'));
        }
        
        console.log('Auth user retrieved:', user.id, user.email);
        
        // 1. Perform update in Profiles table
        console.log('Updating profiles table...');
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            terms_accepted: true,
            accepted_terms_version: doc.version,
            accepted_terms_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select();
          
        if (updateError) {
          console.error('Error updating profiles table:', updateError);
          throw new Error(`Database update failed: ${updateError.message} (${updateError.details || 'Check columns or RLS policies'})`);
        }
        
        console.log('Successfully updated profiles table:', data);
        
        // 2. Refetch profile to verify and ensure cache is clear
        console.log('Refetching updated patient profile...');
        const { data: refetchedProfile, error: refetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (refetchError) {
          console.warn('Profile refetch failed but update succeeded:', refetchError);
        } else {
          console.log('Refetched profile successfully:', refetchedProfile);
        }
        
        // 3. Refresh session / token if necessary to ensure claims are fresh
        console.log('Refreshing authentication session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh warning:', refreshError.message);
        } else {
          console.log('Session refreshed successfully');
        }
      } else {
        console.log('Supabase not configured or user is not a patient. Storing in local state only.');
      }
      
      // 4. Log local terms acceptance so synchronous checks succeed immediately
      logTermsAcceptance(
        userEmail,
        userEmail.split('@')[0],
        userRole,
        doc.version
      );
      
      // 5. Trigger success callback to unlock and redirect immediately
      console.log('Terms accepted successfully. Unlocking and redirecting...');
      onAccept();
      
    } catch (err: any) {
      console.error('CRITICAL: Terms acceptance workflow failed:', err);
      // Display error toast / alert instead of remaining silently on the same page
      alert(`Terms Acceptance Failed: ${err.message || err}\n\nPlease ensure your Supabase schema is up-to-date and RLS policies allow profiles to be updated.`);
    } finally {
      setLoading(false);
    }
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
