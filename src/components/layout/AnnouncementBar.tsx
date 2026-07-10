import React from 'react';
import { 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Tag, 
  Wrench, 
  X, 
  ExternalLink, 
  Megaphone,
  ArrowRight
} from 'lucide-react';
import { Announcement } from '../../types';

interface AnnouncementBarProps {
  location: 'Website Home' | 'Website Inner' | 'Admin' | 'Patient' | 'Doctor' | 'Clinic' | 'Partner' | 'Staff';
  audience: 'All' | 'Visitors' | 'Patients' | 'Doctors' | 'Clinics' | 'Partners' | 'Staff' | 'Admin';
}

export default function AnnouncementBar({ location, audience }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);

  // Function to load and filter announcements
  const loadAnnouncements = () => {
    try {
      const saved = localStorage.getItem('ds_announcements');
      let allAnnouncements: Announcement[] = [];

      if (saved) {
        allAnnouncements = JSON.parse(saved);
      } else {
        // Create initial default mock announcements if none exist
        const initialMock: Announcement[] = [
          {
            id: 'ann-welcome',
            title: 'Welcome to Doct Spark',
            message: '🚀 Welcome to DOCT SPARK! India\'s fastest-growing healthcare ecosystem is now live across Mumbai and Pune districts. Check out our verified clinic listings!',
            type: 'Success',
            icon: 'Megaphone',
            status: 'Published',
            priority: 'High',
            target_audience: 'All',
            display_location: 'Entire Website',
            animation_style: 'Marquee',
            animation_speed: 'Medium',
            background_color: '#E0F2FE', // blue
            text_color: '#0369A1',
            border_color: '#BAE6FD',
            link_enabled: true,
            button_text: 'Browse Clinics',
            button_url: '#',
            dismissible: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'ann-maint',
            title: 'Scheduled Telemedicine Maintenance',
            message: '⚠️ Scheduled teleconsultation maintenance on Saturday 11:50 PM to 01:00 AM. Live call services may experience brief 5-minute interruptions.',
            type: 'Maintenance',
            icon: 'Wrench',
            status: 'Published',
            priority: 'Medium',
            target_audience: 'All',
            display_location: 'All Dashboards',
            animation_style: 'Static',
            animation_speed: 'Medium',
            background_color: '#FEF3C7', // Amber
            text_color: '#B45309',
            border_color: '#FDE68A',
            link_enabled: false,
            dismissible: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('ds_announcements', JSON.stringify(initialMock));
        allAnnouncements = initialMock;
      }

      // Filter active and eligible announcements
      const now = new Date();
      const filtered = allAnnouncements.filter(ann => {
        // 1. Must be published
        if (ann.status !== 'Published') return false;

        // 2. Schedule window check
        if (ann.start_datetime) {
          const start = new Date(ann.start_datetime);
          if (now < start) return false;
        }
        if (ann.end_datetime) {
          const end = new Date(ann.end_datetime);
          if (now > end) return false;
        }

        // 3. Location filtering
        const matchesLocation = 
          ann.display_location === 'Entire Website' ||
          ann.display_location === location ||
          (ann.display_location === 'All Dashboards' && [
            'Admin', 'Patient', 'Doctor', 'Clinic', 'Partner', 'Staff'
          ].includes(location)) ||
          (ann.display_location === 'Website Inner' && location === 'Website Inner') ||
          (ann.display_location === 'Website Home' && location === 'Website Home');

        if (!matchesLocation) return false;

        // 4. Audience filtering
        const matchesAudience = 
          ann.target_audience === 'All' ||
          ann.target_audience === audience ||
          (ann.target_audience === 'Visitors' && audience === 'Visitors') ||
          (ann.target_audience === 'Patients' && audience === 'Patients') ||
          (ann.target_audience === 'Doctors' && audience === 'Doctors') ||
          (ann.target_audience === 'Clinics' && audience === 'Clinics') ||
          (ann.target_audience === 'Partners' && audience === 'Partners') ||
          (ann.target_audience === 'Staff' && audience === 'Staff') ||
          (ann.target_audience === 'Admin' && audience === 'Admin');

        if (!matchesAudience) return false;

        // 5. Dismissed list check
        const savedDismissed = localStorage.getItem('ds_dismissed_announcements');
        const dismissedList: string[] = savedDismissed ? JSON.parse(savedDismissed) : [];
        if (dismissedList.includes(ann.id)) return false;

        return true;
      });

      // Sort by priority weights: Emergency (4) > High (3) > Medium (2) > Low (1)
      const priorityWeights: Record<string, number> = {
        'Emergency': 4,
        'High': 3,
        'Medium': 2,
        'Low': 1
      };

      filtered.sort((a, b) => {
        const weightA = priorityWeights[a.priority] || 1;
        const weightB = priorityWeights[b.priority] || 1;
        return weightB - weightA; // Descending
      });

      setAnnouncements(filtered);
    } catch (e) {
      console.error('Error loading announcements', e);
    }
  };

  // Load dismissed array on mount
  React.useEffect(() => {
    const savedDismissed = localStorage.getItem('ds_dismissed_announcements');
    if (savedDismissed) {
      setDismissedIds(JSON.parse(savedDismissed));
    }
    loadAnnouncements();

    // Listen to administrative updates or storage updates
    const handleUpdate = () => {
      loadAnnouncements();
    };
    window.addEventListener('ds-announcements-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('ds-announcements-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [location, audience]);

  // Handle auto-rotation
  React.useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000); // Rotate every 6 seconds for readability

    return () => clearInterval(interval);
  }, [announcements]);

  // Reset index if announcements list shrinks
  React.useEffect(() => {
    if (currentIndex >= announcements.length && announcements.length > 0) {
      setCurrentIndex(0);
    }
  }, [announcements, currentIndex]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedDismissed = [...dismissedIds, id];
    setDismissedIds(updatedDismissed);
    localStorage.setItem('ds_dismissed_announcements', JSON.stringify(updatedDismissed));
    
    // Remove from active state immediately
    setAnnouncements(prev => prev.filter(ann => ann.id !== id));
  };

  if (announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex];
  if (!currentAnn) return null;

  // Get default Icon based on type
  const getIcon = (type: string, iconName?: string) => {
    if (iconName && iconName !== 'default' && iconName !== 'Megaphone') {
      switch (iconName) {
        case 'Info': return <Info className="w-4 h-4 shrink-0" />;
        case 'CheckCircle': return <CheckCircle className="w-4 h-4 shrink-0" />;
        case 'AlertTriangle': return <AlertTriangle className="w-4 h-4 shrink-0" />;
        case 'AlertOctagon': return <AlertOctagon className="w-4 h-4 shrink-0" />;
        case 'Tag': return <Tag className="w-4 h-4 shrink-0" />;
        case 'Wrench': return <Wrench className="w-4 h-4 shrink-0" />;
        default: break;
      }
    }
    switch (type) {
      case 'Information': return <Info className="w-4 h-4 shrink-0" />;
      case 'Success': return <CheckCircle className="w-4 h-4 shrink-0" />;
      case 'Warning': return <AlertTriangle className="w-4 h-4 shrink-0" />;
      case 'Emergency': return <AlertOctagon className="w-4 h-4 shrink-0" />;
      case 'Offer': return <Tag className="w-4 h-4 shrink-0" />;
      case 'Maintenance': return <Wrench className="w-4 h-4 shrink-0" />;
      default: return <Megaphone className="w-4 h-4 shrink-0" />;
    }
  };

  // Determine marquee speed duration (customizable)
  const getMarqueeDuration = (speed: string) => {
    switch (speed) {
      case 'Slow': return '35s';
      case 'Fast': return '12s';
      case 'Medium':
      default:
        return '22s';
    }
  };

  const isDark = currentAnn.background_color && (
    currentAnn.background_color.toLowerCase() === '#1e293b' || 
    currentAnn.background_color.toLowerCase() === '#0f172a' ||
    currentAnn.background_color.toLowerCase() === '#000000' ||
    currentAnn.background_color.startsWith('#1') ||
    currentAnn.background_color.startsWith('#0')
  );

  return (
    <div 
      className={`relative w-full overflow-hidden border-b transition-all duration-500 shrink-0 flex items-center justify-between ${
        currentAnn.padding || 'py-1.5 px-4 md:px-8'
      } ${currentAnn.height || 'h-auto'}`}
      style={{
        backgroundColor: currentAnn.background_color || '#F0F7F7',
        color: currentAnn.text_color || '#0A6E6E',
        borderColor: currentAnn.border_color || '#D1E5E5',
        fontSize: currentAnn.font_size === 'text-xs' ? '11px' : currentAnn.font_size === 'text-[10px]' ? '10px' : currentAnn.font_size === 'text-sm' ? '13px' : '12px'
      }}
      id={`announcement-bar-${currentAnn.id}`}
    >
      {/* Dynamic Keyframe Injection for smooth marquee scrolling across all screen widths */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .announcement-marquee {
          white-space: nowrap;
          display: inline-block;
          animation: marquee-scroll ${getMarqueeDuration(currentAnn.animation_speed)} linear infinite;
        }
        .announcement-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-center">
        {currentAnn.animation_style === 'Marquee' ? (
          <div className="w-full overflow-hidden">
            <div className="announcement-marquee flex items-center gap-4 cursor-pointer">
              {getIcon(currentAnn.type, currentAnn.icon)}
              <span className="font-extrabold uppercase tracking-wider text-[10px] bg-white/20 px-2 py-0.5 rounded mr-1">
                {currentAnn.type}
              </span>
              <span className="font-semibold tracking-wide">{currentAnn.message}</span>
              {currentAnn.link_enabled && currentAnn.button_url && (
                <a 
                  href={currentAnn.button_url}
                  className={`inline-flex items-center gap-1 text-[11px] font-black underline hover:opacity-80 transition-opacity ml-2`}
                >
                  {currentAnn.button_text || 'Learn More'} <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 text-center px-4 w-full animate-fade-in">
            {getIcon(currentAnn.type, currentAnn.icon)}
            <span className="font-semibold tracking-wide text-xs sm:text-sm flex items-center flex-wrap justify-center gap-2">
              <span className="font-extrabold uppercase tracking-widest text-[9px] bg-black/10 px-1.5 py-0.5 rounded-md">
                {currentAnn.type}
              </span>
              {currentAnn.message}
              {currentAnn.link_enabled && currentAnn.button_url && (
                <a 
                  href={currentAnn.button_url}
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold ml-1.5 px-2.5 py-0.5 bg-[#0A6E6E] hover:bg-[#085353] text-white rounded-md shadow-3xs transition-all border border-[#0A6E6E]/10"
                  style={{
                    backgroundColor: isDark ? '#ffffff' : undefined,
                    color: isDark ? '#0F172A' : undefined
                  }}
                >
                  {currentAnn.button_text || 'Learn More'} <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Active rotation bullets indicator (if multiple) */}
      {announcements.length > 1 && (
        <div className="hidden md:flex items-center gap-1 mx-3 shrink-0">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: currentIndex === index ? (currentAnn.text_color || '#0A6E6E') : `${currentAnn.text_color || '#0A6E6E'}40`
              }}
              title={`Switch to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Close button for dismissible announcements */}
      {currentAnn.dismissible && (
        <button
          onClick={(e) => handleDismiss(currentAnn.id, e)}
          className="p-1 hover:bg-black/10 text-inherit rounded-full cursor-pointer transition-colors ml-2 shrink-0 flex items-center justify-center"
          aria-label="Dismiss Announcement"
          id={`dismiss-announcement-${currentAnn.id}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
