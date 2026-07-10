import React from 'react';
import { 
  FileText, ShieldCheck, Clock, Search, Download, Trash2, Edit3, Plus, 
  Settings, CheckCircle, AlertTriangle, Eye, RefreshCw, Upload, FileDown, 
  ExternalLink, Calendar, Printer, BarChart2, Globe, Sparkles, Send, Copy, ArrowRight
} from 'lucide-react';
import { 
  getTermsDocuments, 
  getTermsVersions, 
  getTermsAcceptanceLogs, 
  createTermsVersion, 
  saveTermsDocuments, 
  TermsDocument, 
  TermsVersion, 
  TermsAcceptanceLog,
  SeoSettings
} from '../../data/termsUtils';
import { addAuditLog } from '../../data/commissionUtils';

export default function TermsManagementModule() {
  const [documents, setDocuments] = React.useState<TermsDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = React.useState<string>('patient');
  const [versions, setVersions] = React.useState<TermsVersion[]>([]);
  const [logs, setLogs] = React.useState<TermsAcceptanceLog[]>([]);
  
  // Editor State
  const [editorTitle, setEditorTitle] = React.useState('');
  const [editorContent, setEditorContent] = React.useState('');
  const [editorStatus, setEditorStatus] = React.useState<'Published' | 'Draft' | 'Archived'>('Published');
  const [requireReacceptance, setRequireReacceptance] = React.useState(false);
  const [changeReason, setChangeReason] = React.useState('');
  
  // SEO Settings State
  const [seoPageTitle, setSeoPageTitle] = React.useState('');
  const [seoMetaTitle, setSeoMetaTitle] = React.useState('');
  const [seoMetaDescription, setSeoMetaDescription] = React.useState('');
  const [seoKeywords, setSeoKeywords] = React.useState('');
  const [seoSlug, setSeoSlug] = React.useState('');
  const [seoCanonical, setSeoCanonical] = React.useState('');
  const [seoOgTags, setSeoOgTags] = React.useState('');
  const [seoTwitterTags, setSeoTwitterTags] = React.useState('');
  const [seoRobots, setSeoRobots] = React.useState('');
  const [seoSchema, setSeoSchema] = React.useState('');

  // Rich Text Editor Helpers & UI States
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [showHtmlSource, setShowHtmlSource] = React.useState(false);
  
  // PDF upload / management simulation
  const [pdfFileName, setPdfFileName] = React.useState<string | null>(null);
  const [pdfUploadLoading, setPdfUploadLoading] = React.useState(false);

  // Scheduling States
  const [scheduledPublish, setScheduledPublish] = React.useState<string>('');
  const [scheduledExpiry, setScheduledExpiry] = React.useState<string>('');

  // Search & Reports Filtering
  const [activeSubTab, setActiveSubTab] = React.useState<'editor' | 'reports' | 'history'>('editor');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchRegType, setSearchRegType] = React.useState('all');
  const [searchVer, setSearchVer] = React.useState('all');
  const [searchDate, setSearchDate] = React.useState('');

  // Feedback Notification
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Load database on start
  const loadData = () => {
    const docsList = getTermsDocuments();
    setDocuments(docsList);
    
    const doc = docsList.find(d => d.id === selectedDocId);
    if (doc) {
      setEditorTitle(doc.title);
      setEditorContent(doc.content);
      setEditorStatus(doc.publishingStatus);
      setRequireReacceptance(doc.requireReacceptance);
      setChangeReason('');
      
      // Load SEO
      setSeoPageTitle(doc.seoSettings.pageTitle);
      setSeoMetaTitle(doc.seoSettings.metaTitle);
      setSeoMetaDescription(doc.seoSettings.metaDescription);
      setSeoKeywords(doc.seoSettings.keywords);
      setSeoSlug(doc.seoSettings.slug);
      setSeoCanonical(doc.seoSettings.canonicalUrl);
      setSeoOgTags(doc.seoSettings.ogTags);
      setSeoTwitterTags(doc.seoSettings.twitterTags);
      setSeoRobots(doc.seoSettings.robots);
      setSeoSchema(doc.seoSettings.schemaMarkup);
      setPdfFileName(doc.pdfFileName);
      setScheduledPublish(doc.scheduledPublishDate || '');
      setScheduledExpiry(doc.scheduledExpiryDate || '');
    }

    setVersions(getTermsVersions(selectedDocId));
    setLogs(getTermsAcceptanceLogs());
  };

  React.useEffect(() => {
    loadData();
  }, [selectedDocId]);

  // Handle document switch with unsaved warnings (simulation)
  const handleDocSwitch = (id: string) => {
    setSelectedDocId(id);
  };

  // Show success feedback
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Trigger rich text editor execution commands or wrap text simulation
  const applyFormatting = (tag: string, value?: string) => {
    if (showHtmlSource) return;
    
    let wrapStart = '';
    let wrapEnd = '';
    
    switch (tag) {
      case 'bold':
        wrapStart = '<strong>';
        wrapEnd = '</strong>';
        break;
      case 'italic':
        wrapStart = '<em>';
        wrapEnd = '</em>';
        break;
      case 'underline':
        wrapStart = '<u>';
        wrapEnd = '</u>';
        break;
      case 'h2':
        wrapStart = '<h2>';
        wrapEnd = '</h2>';
        break;
      case 'h3':
        wrapStart = '<h3>';
        wrapEnd = '</h3>';
        break;
      case 'p':
        wrapStart = '<p>';
        wrapEnd = '</p>';
        break;
      case 'quote':
        wrapStart = '<blockquote>';
        wrapEnd = '</blockquote>';
        break;
      case 'code':
        wrapStart = '<pre><code>';
        wrapEnd = '</code></pre>';
        break;
      case 'bullet':
        wrapStart = '<ul><li>';
        wrapEnd = '</li></ul>';
        break;
      case 'number':
        wrapStart = '<ol><li>';
        wrapEnd = '</li></ol>';
        break;
      case 'hr':
        setEditorContent(prev => prev + '\n<hr />\n');
        return;
      case 'table':
        setEditorContent(prev => prev + '\n<table class="border-collapse border border-slate-300 w-full my-4">\n  <thead>\n    <tr class="bg-slate-50">\n      <th class="border border-slate-300 p-2">Header 1</th>\n      <th class="border border-slate-300 p-2">Header 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border border-slate-300 p-2">Row 1 Col 1</td>\n      <td class="border border-slate-300 p-2">Row 1 Col 2</td>\n    </tr>\n  </tbody>\n</table>\n');
        return;
      case 'link':
        const url = prompt('Enter hyperlink URL:', 'https://');
        if (url) {
          wrapStart = `<a href="${url}" class="text-indigo-600 underline" target="_blank">`;
          wrapEnd = '</a>';
        } else {
          return;
        }
        break;
      case 'button':
        const btnUrl = prompt('Enter button target URL:', 'https://');
        if (btnUrl) {
          wrapStart = `<a href="${btnUrl}" class="inline-block bg-indigo-600 text-white font-extrabold px-4 py-2 rounded-lg text-xs" target="_blank">`;
          wrapEnd = '</a>';
        } else {
          return;
        }
        break;
      case 'image':
        const imgUrl = prompt('Enter Image URL:', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600');
        if (imgUrl) {
          setEditorContent(prev => prev + `\n<img src="${imgUrl}" alt="Medical Illustration" class="max-w-full h-auto rounded-xl border border-slate-200 my-4" />\n`);
        }
        return;
      case 'emoji':
        if (value) {
          setEditorContent(prev => prev + value);
        }
        return;
      case 'color':
        if (value) {
          wrapStart = `<span style="color: ${value}">`;
          wrapEnd = '</span>';
        }
        break;
      case 'bg-color':
        if (value) {
          wrapStart = `<span style="background-color: ${value}; padding: 2px 4px; rounded: 4px">`;
          wrapEnd = '</span>';
        }
        break;
      case 'font-family':
        if (value) {
          wrapStart = `<span style="font-family: ${value}">`;
          wrapEnd = '</span>';
        }
        break;
      case 'font-size':
        if (value) {
          wrapStart = `<span style="font-size: ${value}">`;
          wrapEnd = '</span>';
        }
        break;
      case 'align-left':
        wrapStart = '<div class="text-left">';
        wrapEnd = '</div>';
        break;
      case 'align-center':
        wrapStart = '<div class="text-center">';
        wrapEnd = '</div>';
        break;
      case 'align-right':
        wrapStart = '<div class="text-right">';
        wrapEnd = '</div>';
        break;
      default:
        return;
    }

    // Attempt to wrap selected text in textarea
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selected = text.substring(start, end);
      const replacement = wrapStart + (selected || 'Text') + wrapEnd;
      setEditorContent(text.substring(0, start) + replacement + text.substring(end));
      
      // Reset cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrapStart.length, start + wrapStart.length + (selected || 'Text').length);
      }, 50);
    } else {
      setEditorContent(prev => prev + wrapStart + 'Text' + wrapEnd);
    }
  };

  // SEO default filling helper
  const autoGenerateSeo = () => {
    const currentDoc = documents.find(d => d.id === selectedDocId);
    if (!currentDoc) return;
    
    setSeoPageTitle(`${editorTitle || currentDoc.name} | DoctSpark Legal`);
    setSeoMetaTitle(`Official ${editorTitle || currentDoc.name}`);
    setSeoMetaDescription(`Learn about your legal guidelines. Read the official ${editorTitle || currentDoc.name} on DoctSpark, updated for compliance.`);
    setSeoKeywords(`doctspark, ${selectedDocId} agreement, compliance, healthcare legal`);
    setSeoSlug(`${selectedDocId}-terms-conditions`);
    setSeoCanonical(`https://doctspark.in/legal/${selectedDocId}-terms`);
    setSeoOgTags(`og:title=${editorTitle || currentDoc.name}&og:type=website`);
    setSeoTwitterTags(`twitter:card=summary&twitter:title=${editorTitle || currentDoc.name}`);
    setSeoRobots("index, follow");
    setSeoSchema(JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": editorTitle || currentDoc.name,
      "description": `Official ${currentDoc.name} document on DoctSpark platform.`
    }, null, 2));

    triggerSuccess('⚡ SEO Metadata auto-generated from current editor values!');
  };

  // Save changes as draft
  const handleSaveDraft = () => {
    const docs = getTermsDocuments();
    const docIndex = docs.findIndex(d => d.id === selectedDocId);
    if (docIndex === -1) return;

    const oldDoc = docs[docIndex];
    const updatedDoc: TermsDocument = {
      ...oldDoc,
      title: editorTitle,
      content: editorContent,
      publishingStatus: 'Draft',
      requireReacceptance,
      scheduledPublishDate: scheduledPublish || null,
      scheduledExpiryDate: scheduledExpiry || null,
      seoSettings: {
        pageTitle: seoPageTitle,
        metaTitle: seoMetaTitle,
        metaDescription: seoMetaDescription,
        keywords: seoKeywords,
        slug: seoSlug,
        canonicalUrl: seoCanonical,
        ogTags: seoOgTags,
        twitterTags: seoTwitterTags,
        robots: seoRobots,
        schemaMarkup: seoSchema,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'Super Admin'
    };

    docs[docIndex] = updatedDoc;
    saveTermsDocuments(docs);
    setDocuments(docs);

    // Log in Audit Trail
    addAuditLog(
      'Saved Terms Draft',
      'Super Admin',
      `Saved draft for ${updatedDoc.name}: "${editorTitle}". Publishing Status: Draft.`
    );

    triggerSuccess('💾 Terms & Conditions Draft saved successfully.');
  };

  // Publish a new version officially
  const handlePublishNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!editorTitle.trim() || !editorContent.trim()) {
      setErrorMsg('Please specify both Title and Content of the Terms document before publishing.');
      return;
    }

    if (!changeReason.trim()) {
      setErrorMsg('Please specify the "Reason for Update / Release Notes" to document this new version.');
      return;
    }

    try {
      const updated = createTermsVersion(
        selectedDocId,
        {
          title: editorTitle,
          content: editorContent,
          publishingStatus: 'Published',
          requireReacceptance,
          scheduledPublishDate: scheduledPublish || null,
          scheduledExpiryDate: scheduledExpiry || null,
          pdfFileName,
          pdfUrl: pdfFileName ? `/uploads/legal/${selectedDocId}_latest.pdf` : null,
          seoSettings: {
            pageTitle: seoPageTitle,
            metaTitle: seoMetaTitle,
            metaDescription: seoMetaDescription,
            keywords: seoKeywords,
            slug: seoSlug,
            canonicalUrl: seoCanonical,
            ogTags: seoOgTags,
            twitterTags: seoTwitterTags,
            robots: seoRobots,
            schemaMarkup: seoSchema,
          }
        },
        changeReason,
        'Super Admin'
      );

      loadData();
      triggerSuccess(`🚀 Version ${updated.version} published and activated successfully! Notifications dispatched.`);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to publish terms version.');
    }
  };

  // Archive Terms Document
  const handleArchiveTerms = () => {
    if (!confirm('Are you sure you want to ARCHIVE this active terms document? This will remove it from the active registration forms.')) return;
    
    const docs = getTermsDocuments();
    const docIndex = docs.findIndex(d => d.id === selectedDocId);
    if (docIndex === -1) return;

    docs[docIndex].publishingStatus = 'Archived';
    docs[docIndex].updatedAt = new Date().toISOString();
    docs[docIndex].updatedBy = 'Super Admin';
    
    saveTermsDocuments(docs);
    addAuditLog('Archived Terms Document', 'Super Admin', `Archived ${docs[docIndex].name}`);
    loadData();
    triggerSuccess('📂 Terms & Conditions archived successfully.');
  };

  // Restore previous version
  const handleRestoreVersion = (ver: TermsVersion) => {
    if (!confirm(`Are you sure you want to restore and republish Version ${ver.version} of these terms? This will create a new release version.`)) return;

    try {
      const updated = createTermsVersion(
        selectedDocId,
        {
          title: ver.title,
          content: ver.content,
          publishingStatus: 'Published',
          seoSettings: ver.seoSettings,
          pdfFileName: ver.pdfFileName,
          pdfUrl: ver.pdfUrl
        },
        `Restored and reverted back to previous Version ${ver.version}.`,
        'Super Admin'
      );

      loadData();
      triggerSuccess(`🔄 Reverted back successfully. Created new Version ${updated.version} based on ${ver.version}!`);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to restore previous version.');
    }
  };

  // PDF Management mock upload
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setPdfUploadLoading(true);
    setTimeout(() => {
      setPdfFileName(file.name);
      setPdfUploadLoading(false);
      triggerSuccess(`✓ PDF file "${file.name}" uploaded and attached to ${selectedDocId} terms successfully.`);
      addAuditLog('Uploaded PDF for Terms', 'Super Admin', `Attached file: "${file.name}" to ${selectedDocId} terms.`);
    }, 1200);
  };

  // Delete attached PDF
  const handleDeletePdf = () => {
    setPdfFileName(null);
    triggerSuccess('PDF document detached successfully.');
    addAuditLog('Detached PDF for Terms', 'Super Admin', `Detached PDF document from ${selectedDocId} terms.`);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) {
      alert('No records found to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Acceptance ID,User Email,User Name,Registration Type,Accepted Version,Acceptance Date,IP Address,Browser User Agent,Status\n';

    filteredLogs.forEach(l => {
      const row = [
        l.id,
        l.userEmail,
        l.userName.replace(/,/g, ' '),
        l.registrationType,
        l.acceptedVersion,
        l.acceptanceDate.replace(/,/g, ' '),
        l.ipAddress,
        l.browserUserAgent.replace(/,/g, ' '),
        l.status
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Terms_Acceptance_Reports_${selectedDocId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('Exported Acceptance Reports', 'Super Admin', `Exported CSV of terms acceptance reports for ${selectedDocId}`);
    triggerSuccess('📊 CSV Report exported and download triggered.');
  };

  // Print PDF helper for user / admin
  const handlePrintPDF = () => {
    const doc = documents.find(d => d.id === selectedDocId);
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
              .meta { font-size: 12px; color: #718096; margin-bottom: 40px; font-family: monospace; }
              .footer { font-size: 11px; text-align: center; margin-top: 60px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${doc.title}</h1>
            <div class="meta">
              Document ID: ${doc.id.toUpperCase()}_TERMS<br>
              Version: ${doc.version}<br>
              Effective Date: ${new Date(doc.updatedAt).toLocaleDateString()}<br>
              Verified Publisher: DoctSpark Compliance Team
            </div>
            <div>
              ${doc.content}
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} DoctSpark Healthcare Platform. All rights reserved. Generated on ${new Date().toLocaleDateString()}.
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter logs based on search criteria
  const getFilteredLogs = () => {
    return logs.filter(l => {
      // Reg Type Filter
      if (searchRegType !== 'all' && l.registrationType !== searchRegType) return false;
      
      // Version Filter
      if (searchVer !== 'all' && l.acceptedVersion !== searchVer) return false;

      // Date Filter
      if (searchDate && !l.acceptanceDate.includes(searchDate)) return false;

      // Query Filter (Name, Email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = l.userName.toLowerCase().includes(query);
        const emailMatch = l.userEmail.toLowerCase().includes(query);
        const idMatch = l.id.toLowerCase().includes(query);
        return nameMatch || emailMatch || idMatch;
      }

      return true;
    });
  };

  // Calculate stats for current doc
  const getAcceptanceStats = () => {
    const relevantLogs = logs.filter(l => l.registrationType === selectedDocId);
    
    // Simulate total registered for that role in platform
    // This provides realistic mock ratios instead of empty states
    const mockTotalRegisteredMap: Record<string, number> = {
      'patient': 1420,
      'doctor': 345,
      'clinic': 82,
      'physiotherapy': 56,
      'pharmacy': 41,
      'partner': 65
    };

    const totalRegistered = mockTotalRegisteredMap[selectedDocId] || 100;
    const acceptedCount = relevantLogs.length;
    
    // Since some users accepted legacy versions, we find those accepting current latest version
    const latestVersion = documents.find(d => d.id === selectedDocId)?.version || '1.0';
    const acceptedLatestCount = relevantLogs.filter(l => l.acceptedVersion === latestVersion).length;
    const acceptedOldCount = acceptedCount - acceptedLatestCount;
    const neverAcceptedCount = Math.max(0, totalRegistered - acceptedCount);
    
    const pct = Math.round((acceptedCount / totalRegistered) * 100) || 0;

    return {
      totalRegistered,
      acceptedCount,
      acceptedLatestCount,
      acceptedOldCount,
      neverAcceptedCount,
      percentage: pct
    };
  };

  const currentDoc = documents.find(d => d.id === selectedDocId);
  const stats = getAcceptanceStats();
  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Tab Navigation & Selector Group */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">📜 Centralized Legal Agreement CMS</h3>
          <p className="text-[11px] text-gray-400 font-medium">Control official Terms & Conditions, versioning compliance, force re-acceptance prompts, and export log reports.</p>
        </div>

        {/* List of 6 Registration categories */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleDocSwitch(doc.id)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                selectedDocId === doc.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {doc.id === 'patient' && '🩹 Patient'}
              {doc.id === 'doctor' && '🩺 Doctor'}
              {doc.id === 'clinic' && '🏢 Clinic'}
              {doc.id === 'physiotherapy' && '♿ Physio'}
              {doc.id === 'pharmacy' && '💊 Pharmacy'}
              {doc.id === 'partner' && '🤝 Partner'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Dashboard Summary */}
      {currentDoc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center justify-between shadow-3xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">Total Registered {currentDoc.name}</span>
              <h4 className="text-lg font-black text-slate-800 mt-1">{stats.totalRegistered}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Onboarded accounts</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
              <Plus className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center justify-between shadow-3xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider">Accepted Latest V{currentDoc.version}</span>
              <h4 className="text-lg font-black text-slate-800 mt-1">{stats.acceptedLatestCount}</h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{(stats.acceptedLatestCount / stats.totalRegistered * 100).toFixed(1)}% Compliance</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center justify-between shadow-3xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider">Accepted Old Versions</span>
              <h4 className="text-lg font-black text-slate-800 mt-1">{stats.acceptedOldCount}</h4>
              <p className="text-[10px] text-amber-500 font-bold mt-0.5">Pending update re-acceptance</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center justify-between shadow-3xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Never Accepted</span>
              <h4 className="text-lg font-black text-slate-800 mt-1">{stats.neverAcceptedCount}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Legacy/Bypassed users</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Editor & Report Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('editor')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'editor'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-slate-700'
          }`}
        >
          ✍️ Rich Text Editor & Publishing
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'reports'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-slate-700'
          }`}
        >
          📊 Acceptance Logs & CSV Reports
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
            activeSubTab === 'history'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-slate-700'
          }`}
        >
          📜 Version History ({versions.length})
        </button>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-300">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. EDITOR & PUBLISHING VIEW */}
      {activeSubTab === 'editor' && currentDoc && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* Main Rich Text Editor Board */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
            
            {/* Header controls */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                  V{currentDoc.version} {currentDoc.publishingStatus}
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  Last updated by: <span className="text-slate-700">{currentDoc.updatedBy}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isPreviewMode 
                      ? 'bg-slate-800 border-slate-800 text-white' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Document Title</label>
              <input 
                type="text"
                placeholder="Enter formal terms document title..."
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                disabled={isPreviewMode}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-xs font-black text-[#1A2B3C] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {/* Custom Interactive Rich Text ToolBar */}
            {!isPreviewMode && (
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl flex flex-wrap gap-1.5 items-center">
                {/* Formatting block */}
                <button type="button" onClick={() => applyFormatting('bold')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer" title="Bold">B</button>
                <button type="button" onClick={() => applyFormatting('italic')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-black italic text-slate-700 cursor-pointer" title="Italic">I</button>
                <button type="button" onClick={() => applyFormatting('underline')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-black underline text-slate-700 cursor-pointer" title="Underline">U</button>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                {/* Headings */}
                <button type="button" onClick={() => applyFormatting('h2')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer" title="Heading 2">H2</button>
                <button type="button" onClick={() => applyFormatting('h3')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-black text-slate-700 cursor-pointer" title="Heading 3">H3</button>
                <button type="button" onClick={() => applyFormatting('p')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer" title="Paragraph">P</button>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                {/* Lists & alignments */}
                <button type="button" onClick={() => applyFormatting('bullet')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer" title="Unordered List">• List</button>
                <button type="button" onClick={() => applyFormatting('number')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer" title="Ordered List">1. List</button>
                <button type="button" onClick={() => applyFormatting('quote')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs italic text-slate-700 cursor-pointer" title="Quote">Blockquote</button>
                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                {/* Insert Elements */}
                <button type="button" onClick={() => applyFormatting('table')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-semibold" title="Table">Table</button>
                <button type="button" onClick={() => applyFormatting('hr')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-semibold" title="Line">--- Line</button>
                <button type="button" onClick={() => applyFormatting('link')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-semibold" title="Link">Link</button>
                <button type="button" onClick={() => applyFormatting('image')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-semibold" title="Image">Image</button>
                <button type="button" onClick={() => applyFormatting('button')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-semibold" title="Button">Button</button>
                <button type="button" onClick={() => applyFormatting('code')} className="p-1.5 hover:bg-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer font-mono" title="Code block">Code</button>

                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                {/* Quick Color Pickers */}
                <select 
                  onChange={(e) => {
                    if (e.target.value) applyFormatting('color', e.target.value);
                    e.target.value = '';
                  }}
                  className="bg-transparent border-0 text-xs font-bold text-slate-500 hover:text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Color</option>
                  <option value="#E11D48">🔴 Rose</option>
                  <option value="#2563EB">🔵 Blue</option>
                  <option value="#16A34A">🟢 Green</option>
                  <option value="#D97706">🟡 Yellow</option>
                  <option value="#4F46E5">🟣 Indigo</option>
                  <option value="#111827">⚫ Black</option>
                </select>

                <select 
                  onChange={(e) => {
                    if (e.target.value) applyFormatting('font-size', e.target.value);
                    e.target.value = '';
                  }}
                  className="bg-transparent border-0 text-xs font-bold text-slate-500 hover:text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Size</option>
                  <option value="12px">Small</option>
                  <option value="14px">Normal</option>
                  <option value="18px">Medium</option>
                  <option value="24px">Large</option>
                  <option value="36px">Display</option>
                </select>

                {/* Emoji Select */}
                <select 
                  onChange={(e) => {
                    if (e.target.value) applyFormatting('emoji', e.target.value);
                    e.target.value = '';
                  }}
                  className="bg-transparent border-0 text-xs text-slate-500 hover:text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Emoji</option>
                  <option value="📜">📜 Scroll</option>
                  <option value="✓">✓ Check</option>
                  <option value="⚠️">⚠️ Warning</option>
                  <option value="🛡️">🛡️ Shield</option>
                  <option value="🩺">🩺 Medical</option>
                  <option value="💊">💊 Pharmacy</option>
                </select>

                <div className="w-px h-5 bg-slate-300 mx-1 ml-auto"></div>

                {/* Toggle HTML view */}
                <button
                  type="button"
                  onClick={() => setShowHtmlSource(!showHtmlSource)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    showHtmlSource ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {showHtmlSource ? 'Visual Editor' : 'HTML Code'}
                </button>
              </div>
            )}

            {/* Core Textarea / Live Preview Body */}
            <div className="min-h-[350px] border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              {isPreviewMode ? (
                <div className="p-6 bg-white overflow-y-auto max-h-[500px] prose prose-slate max-w-none text-xs">
                  <h1 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 mb-4">{editorTitle || 'Untitled Terms'}</h1>
                  <div 
                    dangerouslySetInnerHTML={{ __html: editorContent || '<p className="text-gray-400">No content loaded. Edit the rich text above.</p>' }} 
                    className="space-y-3 whitespace-normal font-medium text-slate-700"
                  />
                </div>
              ) : (
                <textarea
                  id="editor-textarea"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full min-h-[350px] max-h-[500px] p-4 text-xs font-medium focus:outline-none bg-slate-50/20 text-slate-800 font-sans leading-relaxed"
                  placeholder="Draft your Terms & Conditions content here using HTML tags or the visual editor buttons above..."
                />
              )}
            </div>

            {/* Print Online / Test Read offline view */}
            <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="text-[10px] text-gray-400 font-semibold">
                Tip: Scroll the editor content. You can embed images, lists, tables, and raw styles dynamically.
              </div>
              <button
                type="button"
                onClick={handlePrintPDF}
                className="text-xs bg-white text-slate-700 hover:bg-slate-100 px-3 py-1.5 border border-slate-200 font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Print / Test PDF View
              </button>
            </div>
          </div>

          {/* SIDEBAR: Configuration, SEO & Versioning controls */}
          <div className="space-y-6">
            
            {/* Version control, Release notes & Force Re-acceptance */}
            <form onSubmit={handlePublishNewVersion} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                🚀 Version & Publishing Control
              </h4>

              {/* Toggle Force Reacceptance */}
              <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-2xl space-y-2">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox"
                    id="require-reacceptance-chk"
                    checked={requireReacceptance}
                    onChange={(e) => setRequireReacceptance(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                  />
                  <div>
                    <label htmlFor="require-reacceptance-chk" className="text-xs font-black text-slate-800 cursor-pointer select-none">
                      Require Re-acceptance
                    </label>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                      If enabled, ALL existing users of this role will be blocked by a popup to accept this updated version before accessing their dashboards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Change log / release notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Reason for Update (Release Notes)</label>
                <textarea 
                  required
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Updated Section 3 for compliance with NMC 2026 guidelines."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-[#1A2B3C] focus:bg-white outline-none transition-all"
                />
              </div>

              {/* Publish State */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Status</label>
                  <select
                    value={editorStatus}
                    onChange={(e) => setEditorStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-[#1A2B3C] focus:bg-white outline-none"
                  >
                    <option value="Published">Published (Active)</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Current Version</label>
                  <input 
                    type="text"
                    disabled
                    value={currentDoc.version}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-black text-slate-500 text-center"
                  />
                </div>
              </div>

              {/* Publish Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  🚀 Publish Official Version {parseFloat(currentDoc.version) + 0.1}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-xs py-2 rounded-xl cursor-pointer transition-all text-center"
                  >
                    💾 Save Draft Only
                  </button>
                  <button
                    type="button"
                    onClick={handleArchiveTerms}
                    className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-black text-xs py-2 rounded-xl cursor-pointer transition-all text-center"
                  >
                    📂 Archive Terms
                  </button>
                </div>
              </div>
            </form>

            {/* SEO Settings Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  🔍 SEO & Meta Settings
                </h4>
                <button 
                  type="button"
                  onClick={autoGenerateSeo}
                  className="text-[10px] text-indigo-600 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  ⚡ Auto-fill SEO
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Page URL Slug</label>
                  <input 
                    type="text"
                    value={seoSlug}
                    onChange={(e) => setSeoSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 focus:bg-white focus:outline-none"
                    placeholder="e.g. patient-terms"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Meta Title Tag</label>
                  <input 
                    type="text"
                    value={seoMetaTitle}
                    onChange={(e) => setSeoMetaTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 focus:bg-white focus:outline-none"
                    placeholder="Enter SEO meta title"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Meta Description</label>
                  <textarea 
                    rows={2}
                    value={seoMetaDescription}
                    onChange={(e) => setSeoMetaDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 focus:bg-white focus:outline-none"
                    placeholder="Enter short meta search description"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Search Keywords</label>
                  <input 
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 focus:bg-white focus:outline-none"
                    placeholder="e.g. terms, medical, agreement"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Canonical URL</label>
                  <input 
                    type="text"
                    value={seoCanonical}
                    onChange={(e) => setSeoCanonical(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Open Graph Tags (og:)</label>
                  <textarea 
                    rows={2}
                    value={seoOgTags}
                    onChange={(e) => setSeoOgTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-xs text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Schema Markup (JSON-LD)</label>
                  <textarea 
                    rows={3}
                    value={seoSchema}
                    onChange={(e) => setSeoSchema(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-[10px] text-slate-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Document PDF Attachment & Print Manager */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                📁 PDF Document Manager
              </h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                Provide an official PDF version of these terms for offline downloads and user print references.
              </p>

              {pdfFileName ? (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{pdfFileName}</p>
                      <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block font-mono">Attachment Verified</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1.5 border-t border-indigo-100/40">
                    <button
                      type="button"
                      onClick={() => alert('Download triggered for attached official Terms PDF.')}
                      className="flex-1 text-center bg-white border border-indigo-100 text-indigo-700 hover:bg-indigo-100/50 font-black text-[10px] py-1.5 rounded-lg cursor-pointer transition-all"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePdf}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer"
                      title="Detach PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center transition-all relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={pdfUploadLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-extrabold text-slate-600 block">
                      {pdfUploadLoading ? 'Processing upload...' : 'Upload Official PDF'}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">Maximum size: 5MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Publish & Expiry Controls */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                📅 Automated Scheduler
              </h4>
              <p className="text-[10px] text-gray-400 font-semibold">Optionally set a targeted date and time to automatically trigger publishing or expiration states.</p>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Schedule Publish Date</label>
                  <input 
                    type="datetime-local"
                    value={scheduledPublish}
                    onChange={(e) => setScheduledPublish(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Schedule Expiry Date</label>
                  <input 
                    type="datetime-local"
                    value={scheduledExpiry}
                    onChange={(e) => setScheduledExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. ACCEPTANCE REPORTS & EXPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📊 User Compliance Logs & Export Engine</h3>
              <p className="text-[11px] text-gray-400">Search chronological logs of legal consent captured on registrations or post-login popups.</p>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Acceptance (CSV/Excel)
            </button>
          </div>

          {/* Search, filters, and dynamic queries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <input 
                type="text"
                placeholder="Search by User Name, Email, or Acceptance Log ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 pl-8 text-xs font-semibold text-[#1A2B3C] focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" />
            </div>

            <div>
              <select
                value={searchRegType}
                onChange={(e) => setSearchRegType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-600 focus:bg-white outline-none"
              >
                <option value="all">Registration: All</option>
                <option value="patient">Patient Forms</option>
                <option value="doctor">Doctor Forms</option>
                <option value="clinic">Clinic Forms</option>
                <option value="physiotherapy">Physiotherapy Forms</option>
                <option value="pharmacy">Pharmacy Forms</option>
                <option value="partner">Partner Forms</option>
              </select>
            </div>

            <div>
              <select
                value={searchVer}
                onChange={(e) => setSearchVer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-600 focus:bg-white outline-none"
              >
                <option value="all">Version: All</option>
                <option value="1.0">Version 1.0</option>
                <option value="1.1">Version 1.1</option>
                <option value="2.0">Version 2.0</option>
              </select>
            </div>

            <div>
              <input 
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-500 focus:bg-white outline-none"
                title="Search Consent Date"
              />
            </div>
          </div>

          {/* Tabular Reports list */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Acceptance ID</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">User Name & Email</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Registration Form Type</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Accepted Version</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Timestamp</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Network IP Address</th>
                  <th className="p-3 font-extrabold text-[#1A2B3C] font-heading">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getFilteredLogs().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-black text-indigo-700">{log.id}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-800">{log.userName}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{log.userEmail}</div>
                    </td>
                    <td className="p-3 uppercase font-black text-[10px] text-slate-500 tracking-wider">
                      {log.registrationType} Terms
                    </td>
                    <td className="p-3">
                      <span className="bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded border border-indigo-100">
                        V{log.acceptedVersion}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 font-medium">{log.acceptanceDate}</td>
                    <td className="p-3 font-mono text-[10px] text-gray-400 font-bold">{log.ipAddress}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {getFilteredLogs().length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-400 font-semibold bg-slate-50/40">
                      No matching user terms acceptance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. REVISION LOGS & CHANGE TRACKING HISTORY */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📜 Version Revision Logs & Change Tracking</h3>
            <p className="text-[11px] text-gray-400">Complete immutable record of all official releases of Terms & Conditions. Revert back or restore prior compliance documents easily.</p>
          </div>

          <div className="space-y-4">
            {versions.map((ver) => (
              <div key={ver.id} className="border border-slate-100 hover:border-slate-300 p-4 rounded-2xl bg-slate-50/20 transition-all space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-800 font-heading">Version {ver.version}</span>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md">
                      {ver.publishingStatus}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">Published: {new Date(ver.createdAt).toLocaleString()}</span>
                  </div>

                  {ver.version !== currentDoc?.version && (
                    <button
                      onClick={() => handleRestoreVersion(ver)}
                      className="text-xs bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 font-black rounded-lg cursor-pointer transition-all"
                    >
                      🔄 Restore & Rollback to V{ver.version}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1.5 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-700 font-black block">📝 Release Change Logs:</span>
                    <p className="font-semibold text-[#1A2B3C] whitespace-pre-wrap">{ver.changeLog?.reasonForUpdate || 'No logs entered.'}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Publisher: {ver.changeLog?.adminName || ver.createdBy}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider mb-1">SEO Tagging Snapshot</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-bold text-slate-600">
                      <span>Slug: <span className="text-indigo-600 font-mono font-black">{ver.seoSettings?.slug}</span></span>
                      <span>Robots: <span className="text-slate-800 font-black">{ver.seoSettings?.robots}</span></span>
                      <span className="col-span-2 truncate">Title: <span className="text-slate-800 font-extrabold">{ver.seoSettings?.pageTitle}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {versions.length === 0 && (
              <div className="text-center p-8 text-gray-400 font-semibold bg-slate-50/50 rounded-2xl">
                No archived version revisions captured for these terms.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
