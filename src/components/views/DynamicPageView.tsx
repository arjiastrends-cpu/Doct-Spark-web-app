import React from 'react';
import { ArrowLeft, BookOpen, Clock, FileText, Sparkles } from 'lucide-react';

interface DynamicPage {
  id: string;
  title: string;
  content: string;
  slug: string;
  active: boolean;
  addToFooter: boolean;
  lastUpdated?: string;
}

interface DynamicPageViewProps {
  slug: string;
  setView: (view: string) => void;
}

export default function DynamicPageView({ slug, setView }: DynamicPageViewProps) {
  const [pages, setPages] = React.useState<DynamicPage[]>([]);
  const [currentPage, setCurrentPage] = React.useState<DynamicPage | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('ds_dynamic_pages');
    const defaultPages: DynamicPage[] = [
      {
        id: 'dp-about',
        title: 'About Doct Spark',
        content: `<h3>Welcome to DOCT SPARK Healthcare India</h3>
<p>DOCT SPARK is India's fastest growing healthcare digital ecosystem, offering instant, secure and verified telemedicine, outpatient care, and patient referral frameworks across states and districts.</p>
<h4>Our Vision</h4>
<p>To deliver instantaneous and affordable quality outpatient care to every citizen across India. By powering clinics and doctors with advanced, secure digital practice tools, we bridge the gap between urban specialists and rural or semi-urban patient requirements.</p>
<h4>How We Operate</h4>
<p>Our decentralized State, District, and City partner networks actively onboard verified medical practitioners and clinics into our central registries. Patients can securely seek specialist doctors, book physical visits, consult with physicians via secure high-definition video, and receive authenticated digital prescriptions instantly.</p>`,
        slug: 'about-us',
        active: true,
        addToFooter: true,
        lastUpdated: '2026-07-02 12:00'
      },
      {
        id: 'dp-careers',
        title: 'Careers',
        content: `<h3>Join the DOCT SPARK Mission</h3>
<p>We are constantly seeking brilliant, mission-driven technologists, operations managers, and medical professionals who want to rewrite the standards of digital outpatient delivery in India.</p>
<h4>Open Roles</h4>
<ul>
  <li><strong>Principal software Engineer (Full-Stack / React)</strong> - Mumbai / Bengaluru</li>
  <li><strong>District Operations Coordinator</strong> - Pune / Ahmedabad / Chennai</li>
  <li><strong>Lead Telemedicine Consultant</strong> - Telecommuting (Pan-India)</li>
</ul>
<p>Interested applicants can send their dynamic profiles and portfolios directly to careers@doctspark.in.</p>`,
        slug: 'careers',
        active: true,
        addToFooter: true,
        lastUpdated: '2026-07-01 09:30'
      }
    ];

    const allPages: DynamicPage[] = saved ? JSON.parse(saved) : defaultPages;
    setPages(allPages);

    const found = allPages.find(p => p.slug === slug);
    if (found) {
      setCurrentPage(found);
    } else {
      // Fallback if not found
      setCurrentPage(allPages[0] || null);
    }
  }, [slug]);

  if (!currentPage) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Page Not Found</h2>
        <p className="text-gray-500 text-xs">The requested dynamic page does not exist or has been removed.</p>
        <button
          onClick={() => setView('home')}
          className="inline-flex items-center gap-2 bg-[#0A6E6E] hover:bg-[#085353] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back Home
        </button>
      </div>
    );
  }

  const activeSidebarPages = pages.filter(p => p.active && p.slug !== slug);

  return (
    <div className="bg-[#F0F7F7] min-h-screen py-10 px-4 md:px-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-xs font-extrabold text-[#0A6E6E] hover:text-[#085353] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
            <span>Doct Spark</span>
            <span>/</span>
            <span className="text-[#0A6E6E]">{currentPage.title}</span>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 bg-white border border-[#D1E5E5] rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
            
            {/* Page Header */}
            <div className="border-b border-slate-100 pb-5 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#0A6E6E] rounded-full border border-emerald-100 text-[10px] font-black uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Verified Informational Page
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                {currentPage.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Published by Admin
                </span>
                {currentPage.lastUpdated && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Updated: {currentPage.lastUpdated}
                  </span>
                )}
              </div>
            </div>

            {/* Custom Dynamic Content */}
            <div 
              className="prose prose-slate max-w-none text-gray-600 leading-relaxed text-xs md:text-sm space-y-4"
              id="dynamic-page-rendered-html"
            >
              {currentPage.content.startsWith('<') ? (
                // Safely render the admin content block
                <div dangerouslySetInnerHTML={{ __html: currentPage.content }} className="space-y-4" />
              ) : (
                // Text fallback with line breaks
                currentPage.content.split('\n').map((para, i) => (
                  <p key={i} className="mb-3">{para}</p>
                ))
              )}
            </div>

          </div>

          {/* Dynamic Sidebar Links */}
          <div className="space-y-4">
            
            {/* Quick Navigation Card */}
            <div className="bg-white border border-[#D1E5E5] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] rounded-lg">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Other Pages</h3>
              </div>

              {activeSidebarPages.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-semibold italic">No other custom pages active.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeSidebarPages.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setView(`page-${p.slug}`)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#F0F7F7] text-gray-600 hover:text-[#0A6E6E] text-[11px] font-black tracking-wide border border-transparent hover:border-[#D1E5E5]/60 transition-all duration-200"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Support Card */}
            <div className="bg-[#0A6E6E] text-white rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full" />
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-100">Need Assistance?</h4>
              <p className="text-[10px] text-emerald-50 leading-relaxed font-semibold">
                If you are looking for specific medical help, hospital references or registry partnerships, contact our 24/7 central desk.
              </p>
              <a 
                href="mailto:support@doctspark.in"
                className="block text-center w-full py-1.5 bg-white text-[#0A6E6E] text-[10px] font-black rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wider"
              >
                support@doctspark.in
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
