import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { EventItem, RSVP, Comment, Profile } from '../types';
import { 
  Calendar, Clock, MapPin, Users, Send, ArrowLeft, CheckCircle, 
  AlertCircle, Sparkles, User, MessageSquare, Trash2, Heart, Share2 
} from 'lucide-react';

interface EventDetailProps {
  event: EventItem;
  user: any;
  userProfile?: Profile;
  onGoBack: () => void;
  onAuthTrigger: () => void;
}

export default function EventDetail({ event, user, userProfile, onGoBack, onAuthTrigger }: EventDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  
  // RSVP Form States
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // General Loading
  const [loading, setLoading] = useState(true);

  // Auto pre-fill RSVP form if user object is present
  useEffect(() => {
    if (user) {
      setRsvpName(userProfile?.full_name || user?.user_metadata?.full_name || '');
      setRsvpEmail(user?.email || '');
    }
  }, [user, userProfile]);

  // Load RSVPs & Comments & Profile details
  useEffect(() => {
    fetchEventDetails();

    // -- SUPABASE REALTIME --
    // Create live subscription for comment changes!
    const channelName = `realtime-comments-${event.id}`;
    const commentsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // listen to all events (inserts, deletes)
          schema: 'public',
          table: 'comments',
          filter: `event_id=eq.${event.id}`
        },
        () => {
          // Whenever comments table changes, re-fetch to get new items properly joined with profile metadata
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `event_id=eq.${event.id}`
        },
        () => {
          // Realtime updates for RSVP counts
          fetchRSVPs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [event.id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    await Promise.all([
      fetchRSVPs(),
      fetchComments(),
      fetchHostProfile()
    ]);
    setLoading(false);
  };

  const fetchHostProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', event.creator_id)
        .single();

      if (data) {
        setProfiles(prev => ({ ...prev, [event.creator_id]: data }));
      }
    } catch (err) {
      console.warn('Could not fetch host profile', err);
    }
  };

  const fetchRSVPs = async () => {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', event.id);

      if (data) {
        setRsvps(data);
        
        // Check if user is already RSVP'd
        const emailToCheck = user?.email || rsvpEmail;
        if (emailToCheck) {
          const isRegistered = data.some(
            r => r.email.toLowerCase() === emailToCheck.toLowerCase() || (user && r.user_id === user.id)
          );
          if (isRegistered) {
            setRsvpSuccess(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching RSVPs', err);
    }
  };

  const fetchComments = async () => {
    try {
      // Join with profiles to get avatar and full name
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:user_id(id, username, full_name, avatar_url, email)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      if (data) {
        // Cast with profile data mapping
        const formattedComments: Comment[] = data.map((item: any) => ({
          id: item.id,
          created_at: item.created_at,
          event_id: item.event_id,
          user_id: item.user_id,
          content: item.content,
          profiles: item.profiles ? {
            id: item.profiles.id,
            username: item.profiles.username,
            full_name: item.profiles.full_name,
            avatar_url: item.profiles.avatar_url,
            email: item.profiles.email,
          } : undefined
        }));
        setComments(formattedComments);
      }
    } catch (err) {
      console.error('Error loading comments', err);
    }
  };

  // Submit RSVP
  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpLoading(true);
    setRsvpError(null);

    const rsvpPayload = {
      event_id: event.id,
      user_id: user ? user.id : null,
      name: rsvpName,
      email: rsvpEmail.trim()
    };

    try {
      // Upsert/Insert RSVP
      const { error } = await supabase
        .from('rsvps')
        .insert(rsvpPayload);

      if (error) {
        if (error.code === '23505') {
          // unique violation, already registered
          setRsvpSuccess(true);
        } else {
          throw error;
        }
      } else {
        setRsvpSuccess(true);
      }
      fetchRSVPs();
    } catch (err: any) {
      console.error(err);
      setRsvpError(err.message || 'Unable to register. Please ensure you defined the rsvps table.');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    if (!user) {
      onAuthTrigger();
      return;
    }

    setCommentLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          event_id: event.id,
          user_id: user.id,
          content: commentInput.trim()
        });

      if (error) throw error;
      setCommentInput('');
      fetchComments(); // immediate reload (backed up by realtime subscription listener)
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      fetchComments();
    } catch (err: any) {
      console.error(err);
    }
  };

  const hostProfile = profiles[event.creator_id];
  const dateFormatted = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8" id={`event-detail-${event.id}`}>
      
      {/* Navigation action back button */}
      <button
        onClick={onGoBack}
        className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-semibold transition-all active:scale-95"
        id="back-to-explore-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore</span>
      </button>

      {/* Main 2-column details architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Wide descriptions/wall */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Visual showcase / Title banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="h-56 md:h-76 w-full relative bg-slate-100 dark:bg-slate-950">
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                {event.title}
              </h1>

              {/* Host representation display */}
              <div className="flex items-center space-x-3.5 bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 overflow-hidden shrink-0 ring-2 ring-blue-50/20">
                  {hostProfile?.avatar_url ? (
                    <img src={hostProfile.avatar_url} alt={hostProfile.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
                    Hosted By
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {hostProfile?.full_name || 'Autonomous Host'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                    {hostProfile?.username ? `@${hostProfile.username}` : 'Verified Event Curator'}
                  </p>
                </div>
              </div>

              {/* Details paragraphs */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                  About Event
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                  {event.description || "No further description provided for this calendar event."}
                </p>
              </div>

            </div>
          </div>

          {/* COMMENT WALL SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-85% pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/45 text-blue-600 dark:text-blue-400 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Live Comment Wall
                </h3>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 font-bold font-mono">
                {comments.length} Comments
              </span>
            </div>

            {/* Comment block list */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" id="comments-timeline-box">
              {comments.length > 0 ? (
                comments.map((comment) => {
                  const isOwnComment = user && comment.user_id === user.id;
                  const commentDate = new Date(comment.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={comment.id} 
                      className={`flex items-start space-x-3 p-3 rounded-2xl group transition-all duration-200 ${
                        isOwnComment 
                          ? 'bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/30' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/20'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-8.5 h-8.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-850 shrink-0 border border-slate-200 dark:border-slate-800">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-[10px]">
                            {comment.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {comment.profiles?.full_name || 'Former Member'}
                            </span>
                            {comment.profiles?.username && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                @{comment.profiles.username}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] text-slate-400 font-sans">
                              {commentDate}
                            </span>
                            {isOwnComment && (
                              <button
                                onClick={() => handleCommentDelete(comment.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-0.5"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-750 mb-2" />
                  <p>No comments on this board yet. Host your thoughts or say hello first!</p>
                </div>
              )}
            </div>

            {/* Comment Form input */}
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-85%" id="create-comment-form">
              <input
                type="text"
                placeholder={user ? "Write something meaningful is live..." : "Sign in to say hello on this event page!"}
                disabled={!user}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100/50 disabled:dark:bg-slate-950/20 disabled:cursor-not-allowed disabled:text-slate-400"
                id="comment-input-field"
              />
              <button
                type="submit"
                disabled={commentLoading || !commentInput.trim() || !user}
                className="p-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:bg-slate-300 rounded-xl transition-all"
                id="submit-comment-btn"
                title="Publish comment"
              >
                {commentLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin block"></span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {!user && (
              <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/40 rounded-xl flex items-center justify-between">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Want to post a message? Join now.</span>
                <button
                  type="button"
                  onClick={onAuthTrigger}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  Sign In Instantly
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: RSVP & Quick Metadata Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Calendar schedule and venue quick cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Schedule</p>
              <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-300">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{dateFormatted}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {event.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Venue Location</p>
              <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-300">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">{event.location}</p>
                </div>
              </div>

              {/* Mini illustrated Maps placeholder */}
              <div className="mt-3.5 h-24 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-15">
                  <div className="w-full h-full bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>
                <div className="z-10 text-center text-slate-400 dark:text-slate-500">
                  <MapPin className="w-5 h-5 text-red-500 mx-auto animate-bounce mb-1" />
                  <span className="text-[9px] font-bold tracking-wider font-mono">MAP PLACEHOLDER</span>
                </div>
              </div>
            </div>
          </div>

          {/* RSVP SUBMISSION MECHANISM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-5" id="rsvp-registration-card">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Registration / RSVP
              </h3>
            </div>

            {rsvpSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2.5" id="rsvp-success-banner">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-slate-900 dark:text-slate-100 font-bold text-sm tracking-tight">Your Space is Reserved!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are registered under <strong>{rsvpEmail || user?.email}</strong>. See you at the gathering!
                </p>
                {/* RSVP Count */}
                <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
                  Going status verified
                </span>
              </div>
            ) : (
              <form onSubmit={handleRSVPSubmit} className="space-y-3.5" id="rsvp-form">
                
                {rsvpError && (
                  <div className="p-3 bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl text-xs flex items-center space-x-1.5" id="rsvp-submit-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] leading-tight font-medium">{rsvpError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Taylor Smith"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                    id="rsvp-name-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Your Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="taylor@example.com"
                    value={rsvpEmail}
                    onChange={(e) => setRsvpEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                    id="rsvp-email-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={rsvpLoading}
                  className="w-full py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-97 flex items-center justify-center space-x-1.5"
                  id="submit-rsvp-btn"
                >
                  {rsvpLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>RSVP - Register Spot</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-normal mt-2">
                  Registration saves instantly to Supabase rsvps table. No purchase necessary.
                </p>
              </form>
            )}

            {/* List of Attendees on Right column */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3" id="attendees-subpanel">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold uppercase tracking-wider">Attendees Going ({rsvps.length})</span>
                <span className="font-sans">Communal List</span>
              </div>
              
              {rsvps.length > 0 ? (
                <div className="grid grid-cols-5 gap-2">
                  {rsvps.map((attendee, idx) => {
                    const initials = attendee.name ? attendee.name.substring(0, 2).toUpperCase() : '??';
                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col items-center group relative cursor-help"
                        title={`${attendee.name} (${attendee.email})`}
                      >
                        <div className="w-8.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-blue-600/15 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-400">
                          {initials}
                        </div>
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[50px] font-medium text-center">
                          {attendee.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 text-center italic py-2">
                  Be the first to RSVP to this custom gathering!
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
