import React, { useState } from 'react';
import { EventItem, RSVP, Profile } from '../types';
import EventCard from './EventCard';
import { Calendar, UserCheck, Sparkles } from 'lucide-react';

interface MyEventsListProps {
  user: any;
  events: EventItem[];
  rsvps: RSVP[];
  profiles: Record<string, Profile>;
  allRsvpsList: RSVP[];
  onSelectEvent: (eventId: string) => void;
  onExploreClick: () => void;
  onHostClick: () => void;
}

export default function MyEventsList({
  user,
  events,
  rsvps,
  profiles,
  allRsvpsList,
  onSelectEvent,
  onExploreClick,
  onHostClick
}: MyEventsListProps) {
  const [activeTab, setActiveTab] = useState<'rsvp' | 'host'>('rsvp');

  if (!user) {
    return (
      <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto">
        <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-pulse" />
        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
          Unlock My Events
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          Log in with your email or use our Demo Login to view the events you have RSVP'd to or are currently hosting!
        </p>
      </div>
    );
  }

  // Filter events hosted by current user
  const hostedEvents = events.filter(e => e.creator_id === user.id);

  // Filter RSVPs belonging to the current user (either matching user_id OR matching stored registered email address)
  const myRsvpdEventIds = rsvps
    .filter(r => r.user_id === user.id || r.email.toLowerCase() === user.email.toLowerCase())
    .map(r => r.event_id);

  const rsvpdEvents = events.filter(e => myRsvpdEventIds.includes(e.id));

  // Compute RSVP count for each event
  const getRsvpsCount = (eventId: string) => {
    return allRsvpsList.filter(r => r.event_id === eventId).length;
  };

  const currentList = activeTab === 'rsvp' ? rsvpdEvents : hostedEvents;

  return (
    <div className="space-y-6" id="my-events-section-wrapper">
      
      {/* Tab Select triggers */}
      <div className="flex border-b border-slate-200 dark:border-slate-800" id="my-events-tabs">
        <button
          onClick={() => setActiveTab('rsvp')}
          className={`pb-3.5 px-6 font-display text-sm font-semibold transition-all flex items-center space-x-2 border-b-2 -mb-0.5 ${
            activeTab === 'rsvp'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          id="rsvp-tab-btn"
        >
          <UserCheck className="w-4 h-4" />
          <span>I'm Attending ({rsvpdEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('host')}
          className={`pb-3.5 px-6 font-display text-sm font-semibold transition-all flex items-center space-x-2 border-b-2 -mb-0.5 ${
            activeTab === 'host'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          id="host-tab-btn"
        >
          <Calendar className="w-4 h-4" />
          <span>I'm Hosting ({hostedEvents.length})</span>
        </button>
      </div>

      {/* List container */}
      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="my-events-grid">
          {currentList.map(event => (
            <EventCard
              key={event.id}
              event={event}
              rsvpsCount={getRsvpsCount(event.id)}
              creatorProfile={profiles[event.creator_id]}
              onClick={() => onSelectEvent(event.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto" id="my-events-empty-state">
          <Calendar className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto mb-4" />
          <h4 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
            {activeTab === 'rsvp' ? 'No RSVPs yet' : 'Not hosting any events'}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 mb-6 max-w-xs mx-auto">
            {activeTab === 'rsvp' 
              ? 'Browse our elite calendar list of gatherings and reserve your spot to show up here!'
              : 'Gather thinkers, creators, or friends. Host a custom-built event on our platform now!'
            }
          </p>
          
          <button
            onClick={activeTab === 'rsvp' ? onExploreClick : onHostClick}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 active:scale-95 text-xs font-semibold rounded-xl transition-all"
            id="my-events-cta-btn"
          >
            {activeTab === 'rsvp' ? 'Browse Calendar' : 'Host a Gathering'}
          </button>
        </div>
      )}

    </div>
  );
}
