import React from 'react';
import { Sparkles, Calendar, Plus, User, Sun, Moon, LogIn, Database } from 'lucide-react';
import { Profile } from '../types';

interface HeaderProps {
  currentTab: 'explore' | 'my-events' | 'create' | 'profile';
  setTab: (tab: 'explore' | 'my-events' | 'create' | 'profile') => void;
  user: any;
  userProfile?: Profile;
  onAuthClick: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  supabaseStatus: 'active' | 'schema-missing' | 'offline';
}

export default function Header({
  currentTab,
  setTab,
  user,
  userProfile,
  onAuthClick,
  isDarkMode,
  onThemeToggle,
  supabaseStatus
}: HeaderProps) {
  
  const getStatusBadge = () => {
    switch (supabaseStatus) {
      case 'active':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Connected</span>
          </div>
        );
      case 'schema-missing':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all" title="Supabase URL & Key are fine, but the database tables have not been created yet in SQL editor. Click the setup tab to see instructions!">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            <span>Need SQL Setup</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold font-mono tracking-wider transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Offline / Error</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900" id="global-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* BRAND LOGO */}
        <div 
          onClick={() => setTab('explore')} 
          className="flex items-center space-x-2 cursor-pointer active:scale-95 transition-all"
          id="header-brand-logo"
        >
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-xl shadow-md shadow-indigo-500/10">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
            My AI <span className="text-indigo-600 dark:text-indigo-400">Luma</span>
          </span>
        </div>

        {/* CONNECTION INDICATOR & THEME SWITCH */}
        <div className="flex items-center space-x-2 md:space-x-3">
          
          {/* Connection badge */}
          {getStatusBadge()}

          {/* Theme switcher */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-85% transition-all active:scale-95"
            id="theme-switch-btn"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* NAVIGATION MENUS (Desktop-first style, collapsible, beautiful) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 p-1 rounded-2xl">
          <button
            onClick={() => setTab('explore')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentTab === 'explore'
                ? 'bg-white dark:bg-slate-900 text-indigo-605 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-85%'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-85%'
            }`}
            id="nav-explore-btn"
          >
            Explore
          </button>

          <button
            onClick={() => setTab('my-events')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              currentTab === 'my-events'
                ? 'bg-white dark:bg-slate-900 text-indigo-605 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-85%'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-85%'
            }`}
            id="nav-my-events-btn"
          >
            My Activity
          </button>

          <button
            onClick={() => setTab('create')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center space-x-1.5 ${
              currentTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-indigo-605 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-85%'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-85%'
            }`}
            id="nav-host-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Host</span>
          </button>
        </nav>

        {/* AUTH CONTROLS / PROFILE */}
        <div className="flex items-center space-x-2">
          {user ? (
            <button
              onClick={() => setTab('profile')}
              className={`flex items-center space-x-2 pl-2 pr-3.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
                currentTab === 'profile'
                  ? 'border-indigo-600 bg-indigo-50/15 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-350'
              }`}
              id="profile-nav-btn"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-250 dark:bg-slate-800 ring-2 ring-indigo-500/10">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">
                    {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold truncate max-w-[85px] hidden sm:inline-block">
                {userProfile?.full_name?.split(' ')[0] || 'My Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:opacity-90 active:scale-95 text-xs text-white dark:text-slate-900 font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
              id="auth-trigger-btn"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
