import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Clock, MapPin, Users, FileText, Image as ImageIcon, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface CreateEventFormProps {
  user: any;
  onEventCreated: () => void;
  onCancel: () => void;
}

const PRESET_BANNERS = [
  {
    name: 'Tech & Networking',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Cyberpunk & Beats',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Zen & Healing',
    url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Gourmet Dinner Mixer',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Creative Coding Studio',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Aesthetic Library Club',
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop',
  }
];

export default function CreateEventForm({ user, onEventCreated, onCancel }: CreateEventFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_BANNERS[0].url);
  const [maxCapacity, setMaxCapacity] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('You must be registered and logged in to host events.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title,
          description,
          date,
          time,
          location,
          image_url: imageUrl,
          creator_id: user.id,
          max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null
        })
        .select();

      if (error) throw error;

      onEventCreated();
    } catch (err: any) {
      console.error('Error reserving space', err);
      setErrorMsg(err.message || 'Failed to create event in Supabase. Check if tables are created in your SQL Editor!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm" id="create-event-section">
      
      {/* Banner Preview */}
      <div className="h-44 md:h-56 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <img 
          src={imageUrl} 
          alt="Selected Cover Card" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 to-black/10 flex items-end p-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="font-display text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Design a New Gathering
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6" id="create-event-form">
        
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-start space-x-2" id="create-event-error">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Event Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Parisian Sunset Wine Tasting & Networking"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            id="event-title-input"
          />
        </div>

        {/* Date and Time / Max Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                id="event-date-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Time Range
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g., 18:00 - 20:30"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                id="event-time-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Capacity Limit <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                placeholder="Unlimited"
                min="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                id="event-capacity-input"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Location / Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g., Studio 4B, 120 Champs-Élysées, Paris, France"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="event-location-input"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Event Description & Schedule
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <textarea
              required
              rows={4}
              placeholder="Write a welcoming description, rules, dress codes, or details about the food and drinks you will serve."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="event-description-input"
            />
          </div>
        </div>

        {/* Cover selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center space-x-1">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Choose Display Visual Theme</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-3">
            {PRESET_BANNERS.map((curPreset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImageUrl(curPreset.url)}
                className={`group relative h-20 rounded-xl overflow-hidden border-2 text-left transition-all hover:scale-103 ${
                  imageUrl === curPreset.url 
                    ? 'border-indigo-600 ring-4 ring-indigo-500/10' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <img src={curPreset.url} alt={curPreset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/45 flex items-end p-2">
                  <span className="text-[9px] text-white font-bold leading-tight line-clamp-1">{curPreset.name}</span>
                </div>
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or type/paste any custom Unsplash or image web URL here"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            id="custom-event-image-url-input"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl transition-all"
            id="cancel-create-event-btn"
          >
            Cancel Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-95 active:scale-98 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all"
            id="publish-event-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-white dark:border-t-slate-800 rounded-full animate-spin"></span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Publish Event Instantly</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
