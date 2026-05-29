import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Profile } from '../types';
import { User, Mail, AtSign, Check, UserCircle, Save, Sparkles, Smile } from 'lucide-react';

interface ProfileSettingsProps {
  user: any;
  onRefreshProfile: () => void;
  onLogOut: () => void;
}

const AVATAR_TEMPLATES = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Patches',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Scooter',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Harley',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Callie',
];

export default function ProfileSettings({ user, onRefreshProfile, onLogOut }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({ id: '' });
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Simple fallback if profile record doesn't exist yet
        setProfile({
          id: user.id,
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`
        });
        setFullName(user?.user_metadata?.full_name || '');
        setUsername(user?.email?.split('@')[0] || 'member');
        setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`);
      } else if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`);
      }
    } catch (err) {
      console.error('Error fetching profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const updatedProfile = {
      id: user.id,
      full_name: fullName,
      username: username || undefined,
      avatar_url: avatarUrl,
      email: user.email,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(updatedProfile);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Your profile has been saved securely to Supabase!' });
      onRefreshProfile();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error updating profile. Please make sure the profiles table is configured in your Supabase project.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm" id="profile-container">
      
      {/* Title block */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Profile Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set your display name, username handle, and choose an avant-garde avatar.
          </p>
        </div>
      </div>

      {message && (
        <div 
          className={`p-4 rounded-xl text-xs mb-6 font-medium ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400'
          }`}
          id="profile-msg"
        >
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6" id="profile-form">
        
        {/* Avatar Select Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
            Select Your Avatar
          </label>
          
          <div className="flex flex-col md:flex-row items-center md:space-x-6 space-y-4 md:space-y-0">
            {/* Current Active Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-1 shadow-sm">
                <img 
                  src={avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 p-1 bg-indigo-600 text-white rounded-full text-xs">
                <Smile className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Curated Templates Grid */}
            <div className="flex-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                Choose a handcrafted visual or input any custom image URL below:
              </p>
              <div className="grid grid-cols-8 gap-2 max-w-sm">
                {AVATAR_TEMPLATES.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-lg overflow-hidden bg-slate-50 border transition-all hover:scale-105 active:scale-95 flex items-center justify-center p-0.5 ${
                      avatarUrl === url 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder="Or enter custom avatar image URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              id="custom-avatar-url-input"
            />
          </div>
        </div>

        {/* Full Name & Handle inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Display Full Name
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Taylor Swift"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:border-indigo-100 focus:ring-1"
                id="profile-fullName-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Username Handle
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="taylorswift"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:border-indigo-100 focus:ring-1"
                id="profile-username-input"
              />
            </div>
          </div>
        </div>

        {/* Email display only */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            Email Address (Verified Account)
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              disabled
              value={user.email}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 text-xs cursor-not-allowed font-medium"
              id="profile-email-readonly"
            />
          </div>
        </div>

        {/* Save button & Sign out button */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-95 active:scale-98 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all"
            id="save-profile-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-white dark:border-t-slate-800 rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogOut}
            className="px-6 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-98 text-xs font-semibold rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-950"
            id="logout-profile-btn"
          >
            Sign Out of Application
          </button>
        </div>

      </form>
    </div>
  );
}
