import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { EventItem, RSVP, Profile } from './types';
import { presetEvents } from './data/presetEvents';

// Components
import Header from './components/Header';
import SqlSchemaGuide from './components/SqlSchemaGuide';
import EventCard from './components/EventCard';
import EventDetail from './components/EventDetail';
import CreateEventForm from './components/CreateEventForm';
import MyEventsList from './components/MyEventsList';
import ProfileSettings from './components/ProfileSettings';
import AuthModal from './components/AuthModal';

// Icons
import { 
  Sparkles, Calendar, PlusCircle, Users, Search, AlertCircle, Info, 
  MapPin, Check, Plus, Database, RefreshCw, Layers, User
} from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState<'explore' | 'my-events' | 'create' | 'profile' | 'event-detail'>('explore');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // App States
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | undefined>(undefined);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [allRsvpsList, setAllRsvpsList] = useState<RSVP[]>([]);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Status Indicator
  const [supabaseStatus, setSupabaseStatus] = useState<'active' | 'schema-missing' | 'offline'>('offline');
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Dropdowns
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [seedingMessage, setSeedingMessage] = useState<string | null>(null);

  // Monitor Authenticated State
  useEffect(() => {
    // 1. Fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    });

    // 2. Set up live auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) {
        fetchUserProfile(activeUser.id);
      } else {
        setUserProfile(undefined);
      }
    });

    // 3. Match theme with local element
    const savedTheme = localStorage.getItem('luma-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch / probe Supabase Connection and Tables existence
  const probeSupabaseAndLoadData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      // Test if table 'events' exists and can be read
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');

      if (eventsError) {
        // If SQL connection succeeded but relation doesn't exist, schema is missing
        if (eventsError.code === 'PBRSE' || eventsError.message.includes('relation "public.events" does not exist')) {
          setSupabaseStatus('schema-missing');
          // Load preset seed events as elegant offline fallback
          setEvents(presetEvents);
        } else {
          setSupabaseStatus('offline');
          setEvents(presetEvents);
        }
        console.warn('Supabase Connection Issue:', eventsError.message);
      } else {
        setSupabaseStatus('active');
        if (eventsData && eventsData.length > 0) {
          setEvents(eventsData);
        } else {
          // Connected successfully, but tables are empty - load presetEvents as preview until they seed!
          setEvents(presetEvents);
        }

        // Fetch companion tables if schema exists
        fetchRelatedTablesData();
      }
    } catch (err: any) {
      console.error('Connection error', err);
      setSupabaseStatus('offline');
      setEvents(presetEvents);
    } finally {
      setLoading(false);
    }
  };

  // Triggers once Supabase status is deemed 'active'
  const fetchRelatedTablesData = async () => {
    try {
      // 1. Fetch RSVPs to calculate going counters
      const { data: rsvpsData } = await supabase
        .from('rsvps')
        .select('*');
      if (rsvpsData) setAllRsvpsList(rsvpsData);

      // 2. Fetch profiles to display hosts
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      if (profilesData) {
        const profileMap: Record<string, Profile> = {};
        profilesData.forEach((p: Profile) => {
          profileMap[p.id] = p;
        });
        setProfiles(profileMap);
      }
    } catch (err) {
      console.warn('Error fetching supplemental tables metadata', err);
    }
  };

  useEffect(() => {
    probeSupabaseAndLoadData();
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.log('Profile detail not yet configured', err);
    }
  };

  // Toggle Dark Theme
  const handleThemeToggle = () => {
    const updatedDarkState = !isDarkMode;
    setIsDarkMode(updatedDarkState);
    if (updatedDarkState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('luma-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luma-theme', 'light');
    }
  };

  // Sign out helper
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(undefined);
      setTab('explore');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error signing out.');
    }
  };

  // Automatic/manual seeder to insert the gorgeous sample events into user's database directly
  const handleSeedPresetEvents = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (supabaseStatus !== 'active') {
      alert('Please compile your SQL tables first using the Supabase Setup Guidelines before seeding!');
      return;
    }

    setSeedingLoading(true);
    setSeedingMessage(null);

    try {
      // Standard insert of preset events replacing creator_id with current active user
      const cleanSeeds = presetEvents.map(e => ({
        title: e.title,
        description: e.description,
        date: e.date,
        time: e.time,
        location: e.location,
        image_url: e.image_url,
        creator_id: user.id,
        max_capacity: e.max_capacity
      }));

      const { data, error } = await supabase
        .from('events')
        .insert(cleanSeeds)
        .select();

      if (error) throw error;

      setSeedingMessage('Seed Successful! 4 elegant events have been published into your Supabase database.');
      probeSupabaseAndLoadData(); // reload
    } catch (err: any) {
      console.error(err);
      setSeedingMessage(`Seed failed: ${err.message || 'Verify permissions.'}`);
    } finally {
      setSeedingLoading(false);
    }
  };

  // Filter events based on search query
  const filteredEvents = events.filter(e => {
    const query = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    );
  });

  const getRsvpsCountForEvent = (eventId: string) => {
    return allRsvpsList.filter(r => r.event_id === eventId).length;
  };

  const handleSelectEventDirectly = (eventId: string) => {
    setSelectedEventId(eventId);
    setTab('event-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-20 md:pb-6" id="applet-core-layout">
      
      {/* GLOBAL BANNER NOTIFICATIONS */}
      {supabaseStatus === 'schema-missing' && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm" id="schema-missing-global-alert">
          <Info className="w-4 h-4 shrink-0 animate-bounce" />
          <span>Luma platform is running under preview-fallback. Please paste the SQL queries in Supabase editor to activate live multi-user storage!</span>
        </div>
      )}

      {/* HEADER COMPONENT */}
      <Header
        currentTab={tab === 'event-detail' ? 'explore' : tab}
        setTab={(newTab) => { setTab(newTab); setSelectedEventId(null); }}
        user={user}
        userProfile={userProfile}
        onAuthClick={() => setShowAuthModal(true)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        supabaseStatus={supabaseStatus}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8" id="primary-viewports-container">
        
        {/* VIEW 1: EXPLORE EVENTS CALENDAR */}
        {tab === 'explore' && (
          <div className="space-y-8" id="view-explore-calendar">
            
            {/* HEROS SECTOR */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-85% p-6 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
              <div className="absolute inset-0 opacity-15">
                <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
              </div>
              
              <div className="space-y-4 md:max-w-xl z-10 text-center md:text-left">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono tracking-widest text-indigo-300 uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Elite Event Experience</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
                  Gatherings That Inspire.
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Discover or design elegant mixers, modular synthesis hackathons, teahouse tea ceremonies, and creative coding circles. Powered beautifully by Supabase.
                </p>
                
                {/* Search Bar */}
                <div className="relative max-w-sm mt-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search title, description or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    id="search-input-box"
                  />
                </div>
              </div>

              {/* Dynamic visual badge for database configuration */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 max-w-xs text-center z-10 shrink-0 self-stretch flex flex-col justify-between" id="seeding-instructions-banner">
                <div>
                  <h4 className="font-display font-semibold text-xs text-indigo-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Supabase Project Hook
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    {supabaseStatus === 'active' 
                      ? 'Connected securely to luma_clone_project schema! You can insert records instantly.' 
                      : 'Running on read-only preview datasets. Run SQL to enable real-time storage!'
                    }
                  </p>
                </div>

                {supabaseStatus === 'active' && events.length <= 4 && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <button
                      onClick={handleSeedPresetEvents}
                      disabled={seedingLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/30 text-white rounded-lg text-[10px] font-extrabold tracking-widest uppercase transition-all flex items-center justify-center space-x-1"
                      id="seed-meta-btn"
                    >
                      {seedingLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Seeding...</span>
                        </>
                      ) : (
                        <span>Seed Real Demo Events</span>
                      )}
                    </button>
                    {seedingMessage && <p className="text-[9px] text-indigo-300 font-mono italic leading-tight">{seedingMessage}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* SQL CHEAT SHEET INSTRUCTION (Shown if DB status is not active, helpful for development setup) */}
            {supabaseStatus !== 'active' && <SqlSchemaGuide />}

            {/* EVENTS LIST SEGMENT */}
            <div className="space-y-4" id="events-grid-viewport">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Elite Gatherings Call-board
                  <span className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full font-sans">
                    {filteredEvents.length} list
                  </span>
                </h2>
                
                {supabaseStatus !== 'active' && (
                  <span className="text-[10px] font-bold font-mono tracking-wider dark:text-amber-500/80 uppercase">
                    🔒 Fallback Preview Mode
                  </span>
                )}
              </div>

              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      rsvpsCount={getRsvpsCountForEvent(event.id)}
                      creatorProfile={profiles[event.creator_id]}
                      onClick={() => handleSelectEventDirectly(event.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-4 bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl" id="search-empty-state">
                  <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-850 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No gatherings matched your search filter.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-indigo-650 hover:underline mt-2 font-bold"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: MY EVENTS (ATTENDING OR HOSTING) */}
        {tab === 'my-events' && (
          <div className="space-y-6" id="view-my-activity">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">My Gatherings Activity</h2>
              <p className="text-xs text-slate-500 mt-1">Keep track of places you are going and RSVPs you have submitted.</p>
            </div>
            
            <MyEventsList
              user={user}
              events={events}
              rsvps={allRsvpsList}
              profiles={profiles}
              allRsvpsList={allRsvpsList}
              onSelectEvent={handleSelectEventDirectly}
              onExploreClick={() => setTab('explore')}
              onHostClick={() => setTab('create')}
            />
          </div>
        )}

        {/* VIEW 3: HOST/CREATE EVENT */}
        {tab === 'create' && (
          <div className="space-y-6" id="view-create-event">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Host an Event</h2>
              <p className="text-xs text-slate-500 mt-1">Create an aesthetic cover card, specify schedules, and accept registered RSVPs instantly.</p>
            </div>
            
            {user ? (
              <CreateEventForm
                user={user}
                onEventCreated={() => {
                  setTab('explore');
                  probeSupabaseAndLoadData();
                }}
                onCancel={() => setTab('explore')}
              />
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md mx-auto shadow-sm">
                <PlusCircle className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-bounce" />
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">Authorize Guest to Host</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                  You must be logged in to create and host gatherings on this event platform. Click below to sign up securely!
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Log In or Register
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: MY ACCOUNT PROFILE */}
        {tab === 'profile' && (
          <div className="space-y-6" id="view-member-profile">
            {user ? (
              <ProfileSettings
                user={user}
                onRefreshProfile={() => {
                  if (user) fetchUserProfile(user.id);
                }}
                onLogOut={handleSignOut}
              />
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md mx-auto shadow-sm">
                <Users className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="font-display font-medium text-lg text-slate-900">Manage Your Profile</h3>
                <p className="text-xs text-slate-500 mt-2 mb-6">
                  Sign in using Supabase to personalize your name, upload avatars and manage custom listings.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-semibold"
                >
                  Sign In Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: ACTIVE EVENT DETAIL DEEP DIVE */}
        {tab === 'event-detail' && selectedEventId && (
          <div id="view-event-detail">
            {events.find(e => e.id === selectedEventId) ? (
              <EventDetail
                event={events.find(e => e.id === selectedEventId)!}
                user={user}
                userProfile={userProfile}
                onGoBack={() => { setTab('explore'); setSelectedEventId(null); }}
                onAuthTrigger={() => setShowAuthModal(true)}
              />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="font-medium">The selected event could not be retrieved from the Supabase database.</p>
                <button 
                  onClick={() => setTab('explore')} 
                  className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-4 underline"
                >
                  Return to Explore
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MOBILE FLOATING BOTTOM DECK (Exclusive premium mobile navigation experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-150 dark:border-slate-900 py-3 px-4 flex items-center justify-around shadow-lg" id="mobile-navigation-bar">
        <button
          onClick={() => { setTab('explore'); setSelectedEventId(null); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            tab === 'explore' || tab === 'event-detail'
              ? 'text-indigo-650 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          id="mobile-explore-btn"
        >
          <Calendar className="w-5 h-5" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => { setTab('my-events'); setSelectedEventId(null); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            tab === 'my-events'
              ? 'text-indigo-655 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          id="mobile-my-btn"
        >
          <Users className="w-5 h-5" />
          <span>Activity</span>
        </button>

        <button
          onClick={() => { setTab('create'); setSelectedEventId(null); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            tab === 'create'
              ? 'text-indigo-655 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          id="mobile-host-btn"
        >
          <Plus className="w-5 h-5" />
          <span>Host</span>
        </button>

        <button
          onClick={() => { setTab('profile'); setSelectedEventId(null); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            tab === 'profile'
              ? 'text-indigo-655 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
          id="mobile-profile-btn"
        >
          <User className="w-5 h-5" />
          <span>Account</span>
        </button>
      </div>

      {/* AUTH CONTROLLER MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Auto refresh profiles
        }}
      />

    </div>
  );
}
