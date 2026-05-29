export interface Profile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface EventItem {
  id: string;
  created_at: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or free text
  location: string;
  image_url: string;
  creator_id: string;
  max_capacity?: number;
}

export interface RSVP {
  id: string;
  created_at: string;
  event_id: string;
  user_id?: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  created_at: string;
  event_id: string;
  user_id: string;
  content: string;
  profiles?: Profile;
}
