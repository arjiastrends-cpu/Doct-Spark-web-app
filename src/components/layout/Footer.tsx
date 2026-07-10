/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Stethoscope, Heart, Smartphone, ShieldCheck, Award, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

interface FooterProps {
  setView: (view: string) => void;
  setSearchQuery?: (q: string) => void;
}

export default function Footer({ setView, setSearchQuery }: FooterProps) {
  const [socialLinks, setSocialLinks] = React.useState({
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com'
  });

  const [footerLinks, setFooterLinks] = React.useState({
    copyright: '© 2026 DOCT SPARK Healthcare India Pvt. Ltd. Made with',
    location: 'in Mumbai.',
    privacyLabel: 'Privacy Policy',
    privacyUrl: '#',
    termsLabel: 'Terms of Use',
    termsUrl: '#',
    refundLabel: 'Refund & Cancellation',
    refundUrl: '#'
  });

  const [dynamicPages, setDynamicPages] = React.useState<{ id: string; title: string; slug: string; active: boolean; addToFooter: boolean }[]>([]);

  React.useEffect(() => {
    const loadLinks = () => {
      setSocialLinks({
        facebook: localStorage.getItem('ds_social_facebook') || 'https://facebook.com',
        twitter: localStorage.getItem('ds_social_twitter') || 'https://twitter.com',
        instagram: localStorage.getItem('ds_social_instagram') || 'https://instagram.com',
        linkedin: localStorage.getItem('ds_social_linkedin') || 'https://linkedin.com',
        youtube: localStorage.getItem('ds_social_youtube') || 'https://youtube.com'
      });

      setFooterLinks({
        copyright: localStorage.getItem('ds_footer_copyright') || '© 2026 DOCT SPARK Healthcare India Pvt. Ltd. Made with',
        location: localStorage.getItem('ds_footer_location') || 'in Mumbai.',
        privacyLabel: localStorage.getItem('ds_footer_privacy_label') || 'Privacy Policy',
        privacyUrl: localStorage.getItem('ds_footer_privacy_url') || '#',
        termsLabel: localStorage.getItem('ds_footer_terms_label') || 'Terms of Use',
        termsUrl: localStorage.getItem('ds_footer_terms_url') || '#',
        refundLabel: localStorage.getItem('ds_footer_refund_label') || 'Refund & Cancellation',
        refundUrl: localStorage.getItem('ds_footer_refund_url') || '#'
      });

      const savedPages = localStorage.getItem('ds_dynamic_pages');
      const defaultPages = [
        { id: 'dp-about', title: 'About Doct Spark', slug: 'about-us', active: true, addToFooter: true },
        { id: 'dp-careers', title: 'Careers', slug: 'careers', active: true, addToFooter: true }
      ];
      setDynamicPages(savedPages ? JSON.parse(savedPages) : defaultPages);
    };

    loadLinks();

    const handleUpdate = () => {
      loadLinks();
    };

    window.addEventListener('ds-social-links-updated', handleUpdate);
    window.addEventListener('ds-footer-links-updated', handleUpdate);
    window.addEventListener('ds-dynamic-pages-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ds-social-links-updated', handleUpdate);
      window.removeEventListener('ds-footer-links-updated', handleUpdate);
      window.removeEventListener('ds-dynamic-pages-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return (
    <footer className="bg-white border-t border-[#D1E5E5] pt-12 pb-6 px-6 md:px-10 shrink-0 mt-auto" id="main-footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-[#0A6E6E] rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0A6E6E] font-heading">
              DOCT SPARK
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            India's most trusted medical network for instantaneous booking of in-clinic visits and live video consultation sessions with top verified physicians.
          </p>
          <div className="flex gap-4 text-xs font-bold text-[#0A6E6E] mt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#F5A623]" /> 100% Verified
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-[#F5A623]" /> MCI Registered
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5" id="social-media-links">
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white rounded-lg transition-all duration-200 border border-[#D1E5E5]/60 hover:border-transparent flex items-center justify-center shadow-xs" aria-label="Facebook" id="social-fb">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white rounded-lg transition-all duration-200 border border-[#D1E5E5]/60 hover:border-transparent flex items-center justify-center shadow-xs" aria-label="Twitter" id="social-tw">
              <Twitter className="w-4 h-4" />
            </a>
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white rounded-lg transition-all duration-200 border border-[#D1E5E5]/60 hover:border-transparent flex items-center justify-center shadow-xs" aria-label="Instagram" id="social-ig">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white rounded-lg transition-all duration-200 border border-[#D1E5E5]/60 hover:border-transparent flex items-center justify-center shadow-xs" aria-label="LinkedIn" id="social-ln">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white rounded-lg transition-all duration-200 border border-[#D1E5E5]/60 hover:border-transparent flex items-center justify-center shadow-xs" aria-label="YouTube" id="social-yt">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1A2B3C] mb-4">Patient Services</h3>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-600 font-medium">
            <li><button onClick={() => setView('doctors')} className="hover:text-[#0A6E6E] transition-colors">Search for Doctors</button></li>
            <li><button onClick={() => setView('clinics')} className="hover:text-[#0A6E6E] transition-colors">Browse Private Clinics</button></li>
            <li><button onClick={() => { setView('doctors'); setSearchQuery?.('Laboratory'); }} className="hover:text-[#0A6E6E] transition-colors">Laboratory</button></li>
            <li><button onClick={() => { setView('doctors'); setSearchQuery?.('Physiotherapy'); }} className="hover:text-[#0A6E6E] transition-colors">Physiotherapy</button></li>
            <li><button onClick={() => setView('specialties')} className="hover:text-[#0A6E6E] transition-colors">Specialty Consultations</button></li>
            <li><button onClick={() => setView('nearby')} className="hover:text-[#0A6E6E] transition-colors">Find Near Me (Map)</button></li>
            {dynamicPages.filter(p => p.active && p.addToFooter).map(p => (
              <li key={p.id}>
                <button 
                  onClick={() => setView(`page-${p.slug}`)} 
                  className="hover:text-[#0A6E6E] transition-colors text-left"
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Doctor Partners Column */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1A2B3C] mb-4">For Healthcare Providers</h3>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-600 font-medium">
            <li><button onClick={() => setView('register-doctor')} className="hover:text-[#0A6E6E] transition-colors font-bold text-[#0A6E6E]">Join as a Verified Doctor</button></li>
            <li><button onClick={() => setView('register')} className="hover:text-[#0A6E6E] transition-colors">Register Clinic Practice</button></li>
            <li><a href="#" className="hover:text-[#0A6E6E] transition-colors">Clinicians Code of Conduct</a></li>
            <li><a href="#" className="hover:text-[#0A6E6E] transition-colors">Revenue & Withdrawal Policies</a></li>
          </ul>
        </div>

        {/* Mobile Download and Location Information Column */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1A2B3C] mb-2">Available Cities</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Mumbai • Delhi NCR • Bengaluru • Pune • Hyderabad • Chennai • Kolkata • Ahmedabad
            </p>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Download Our App</span>
            <div className="flex gap-2">
              <a href="#" className="bg-[#1A2B3C] hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition-colors border border-gray-800">
                <Smartphone className="w-3.5 h-3.5" />
                <span>App Store</span>
              </a>
              <a href="#" className="bg-[#1A2B3C] hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition-colors border border-gray-800">
                <span>▶</span>
                <span>Play Store</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-[#D1E5E5] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <span>{footerLinks.copyright}</span>
          <Heart className="w-3 h-3 text-[#EF4444] fill-current animate-pulse" />
          <span>{footerLinks.location}</span>
        </div>
        <div className="flex gap-6 font-medium">
          <a href={footerLinks.privacyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0A6E6E] transition-colors">{footerLinks.privacyLabel}</a>
          <a href={footerLinks.termsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0A6E6E] transition-colors">{footerLinks.termsLabel}</a>
          <a href={footerLinks.refundUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0A6E6E] transition-colors">{footerLinks.refundLabel}</a>
        </div>
      </div>
    </footer>
  );
}
