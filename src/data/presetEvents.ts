import { EventItem } from '../types';

export const presetEvents: EventItem[] = [
  {
    id: 'e1111111-2222-3333-4444-555555555551',
    created_at: new Date().toISOString(),
    title: 'Silicon Valley AI Founders Mixer',
    description: 'Join leading generative AI researchers, venture backers, and fellow builders for an evening of warm conversation, gourmet sliders, and demo exchanges. Discover the frontier of Antigravity reasoning agents, live code generation, and ambient neural networks in our stunning rooftop garden overlooking the Palo Alto skyline.',
    date: '2026-06-15',
    time: '18:30 - 21:30',
    location: 'Soma Rooftop Garden, 530 Bryant St, Palo Alto, CA',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
    creator_id: '00000000-0000-0000-0000-000000000000',
    max_capacity: 150
  },
  {
    id: 'e1111111-2222-3333-4444-555555555552',
    created_at: new Date().toISOString(),
    title: 'Midnight Beats & Ambient Code',
    description: 'A focused, highly aesthetic hacking circle for late-night developers. Bring your most complex codebases or start an experimental project while a live modular synthesizer crafts a relaxing, low-frequency atmospheric sonic backdrop. Curated cold brews and artisanal green tea are served throughout.',
    date: '2026-06-28',
    time: '21:00 - 02:00',
    location: 'Cyber Lounge Studio, 88 Mission St, San Francisco, CA',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    creator_id: '00000000-0000-0000-0000-000000000000',
    max_capacity: 45
  },
  {
    id: 'e1111111-2222-3333-4444-555555555553',
    created_at: new Date().toISOString(),
    title: 'Kyoto Zen Meditation & Tea Ceremony',
    description: 'Decompress from the modern tech hustle. An authentic, master-guided afternoon centering around silent breathing exercises, custom-ground stone Uji matcha brewing, and mindful calligraphy exercises. Absolute beginners are welcome; all supplies and traditional handmade Wagashi sweets are provided.',
    date: '2026-07-04',
    time: '14:00 - 16:30',
    location: 'Ritsurin Garden Teahouse, 1420 Chome, Kyoto',
    image_url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?q=80&w=1200&auto=format&fit=crop',
    creator_id: '00000000-0000-0000-0000-000000000000',
    max_capacity: 18
  },
  {
    id: 'e1111111-2222-3333-4444-555555555554',
    created_at: new Date().toISOString(),
    title: 'Creative Coding & Interactive Canvas',
    description: 'A hands-on, playful workshop exploring the intersection of creative javascript, physics engines, and generative vector arts. Bring an open mind and a fully charged laptop. We will build custom web audio installations and dynamic layouts using pure canvas scripts and WebGL.',
    date: '2026-07-12',
    time: '13:00 - 17:00',
    location: 'Arts & Pixel Warehouse, Brookly Guild, New York, NY',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    creator_id: '00000000-0000-0000-0000-000000000000',
    max_capacity: 80
  }
];
