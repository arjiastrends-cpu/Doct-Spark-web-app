/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState } from 'react';
import DashboardHeader from './DashboardHeader';
import { X, Menu, Stethoscope } from 'lucide-react';
import { Role } from '../../types';

interface DashboardLayoutProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  
  // Sidebar & main content
  sidebar?: ReactNode;
  children: ReactNode;
  activeTabTitle?: string;
}

export default function DashboardLayout({
  currentView,
  setView,
  userRole,
  setUserRole,
  userEmail,
  setUserEmail,
  notificationsCount,
  onOpenNotifications,
  sidebar,
  children,
  activeTabTitle
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex-grow flex flex-col" id="global-dashboard-layout">
      {/* 1. Global Dashboard Header (Rendered only once) */}
      <DashboardHeader
        currentView={currentView}
        setView={setView}
        userRole={userRole}
        setUserRole={setUserRole}
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        notificationsCount={notificationsCount}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* 2. Responsive Layout Workspace Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="dashboard-workspace-grid">
        
        {/* Local Mobile Sidebar Drawer */}
        {sidebar && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in" id="mobile-sidebar-drawer">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Slide-over panel */}
            <div className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-extrabold text-[#0A6E6E]">Health Control Panel</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Clicking on sidebar links will also close mobile drawer */}
                <div onClick={() => setIsMobileSidebarOpen(false)}>
                  {sidebar}
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <div className="px-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Logged in as</span>
                  <span className="block text-xs font-bold text-slate-800 truncate">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Split (Sidebar + Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="layout-columns">
          {/* COLUMN 1: Sidebar column (only shown if sidebar is passed) */}
          {sidebar ? (
            <>
              <div className="hidden lg:block lg:col-span-1" id="desktop-sidebar-column">
                <div className="sticky top-24 bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs flex flex-col gap-6">
                  {sidebar}
                </div>
              </div>
              {/* COLUMN 2: Main view content */}
              <div className="lg:col-span-3" id="desktop-content-column">
                {children}
              </div>
            </>
          ) : (
            <div className="col-span-1 lg:col-span-4" id="desktop-fullwidth-column">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
