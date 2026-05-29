import React from 'react';
import { EventItem, Profile } from '../types';
import { Calendar, MapPin, Users, User } from 'lucide-react';

interface EventCardProps {
  key?: string | number;
  event: EventItem;
  rsvpsCount: number;
  creatorProfile?: Profile;
  onClick: () => void;
}

export default function EventCard({ event, rsvpsCount, creatorProfile, onClick }: EventCardProps) {
  // Format Date beautifully
  // e.g., "2026-06-15" -> JUN 15
  const formatDateParts = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        return { month: 'DATE', day: '??' };
      }
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString();
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      return { month, day, weekday };
    } catch {
      return { month: 'EVENT', day: '!' };
    }
  };

  const { month, day, weekday } = formatDateParts(event.date);

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full"
      id={`event-card-${event.id}`}
    >
      
      {/* Banner Cover Wrapper */}
      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img 
          src={event.image_url} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Date Stamp overlay (Luma Signature style) */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[50px] shadow-sm border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            {month}
          </span>
          <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
            {day}
          </span>
        </div>

        {/* Capacity overlay (if limited) */}
        {event.max_capacity && (
          <div className="absolute bottom-3 right-3 bg-slate-950/70 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-slate-200 font-semibold tracking-wider uppercase">
            Cap: {event.max_capacity}
          </div>
        )}
      </div>

      {/* Card Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Weekday & time */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
            <Calendar className="w-3 h-3" />
            <span>{weekday}, {event.time}</span>
          </div>

          <h3 className="font-display font-medium text-[15px] group-hover:text-blue-600 dark:group-hover:text-blue-400 text-slate-900 dark:text-slate-100 tracking-tight leading-snug line-clamp-2 min-h-[44px]">
            {event.title}
          </h3>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 mt-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Footer info: Hosts and registered guests */}
        <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          
          {/* Host representation */}
          <div className="flex items-center space-x-2">
            {creatorProfile?.avatar_url ? (
              <img 
                src={creatorProfile.avatar_url} 
                alt={creatorProfile.full_name || 'Host'} 
                className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <User className="w-3 h-3 text-slate-400" />
              </div>
            )}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[85px]">
              By {creatorProfile?.full_name || 'Platform Host'}
            </span>
          </div>

          {/* Attendee indicators */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
            <Users className="w-3 h-3" />
            <span>{rsvpsCount} {rsvpsCount === 1 ? 'Going' : 'Going'}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
