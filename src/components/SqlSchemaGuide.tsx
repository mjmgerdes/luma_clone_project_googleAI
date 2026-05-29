import React, { useState, useEffect } from 'react';
import { Database, FileText, Check, Copy, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Key, ShieldCheck, Terminal } from 'lucide-react';

export default function SqlSchemaGuide() {
  const [isOpen, setIsOpen] = useState(true); // Default open to guide the user clearly
  const [copied, setCopied] = useState(false);
  
  // Migration state
  const [connectionString, setConnectionString] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateSuccess, setMigrateSuccess] = useState<string | null>(null);
  const [migrateError, setMigrateError] = useState<string | null>(null);

  // Status check state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Test current configuration status on load
  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      if (data.configured) {
        setIsConfigured(true);
        setStatusMessage(data.message || 'Database configured successfully.');
      } else {
        setIsConfigured(false);
        setStatusMessage(null);
      }
    } catch {
      setStatusMessage(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleAutoMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMigrating(true);
    setMigrateError(null);
    setMigrateSuccess(null);

    const targetUrl = connectionString.trim();

    try {
      const res = await fetch('/api/db/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString: targetUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error occurred during migration.');
      }

      setMigrateSuccess(data.message);
      setConnectionString('');
      
      // Auto reload after 3.5 seconds to refresh the frontend state with the new database
      setTimeout(() => {
        window.location.reload();
      }, 3500);

    } catch (err: any) {
      setMigrateError(err.message || 'Failed to complete migration request.');
    } finally {
      setMigrating(false);
    }
  };

  const sqlSchema = `-- 1. Create Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  email text
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);


-- 2. Create Events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  date date not null,
  time text not null,
  location text not null,
  image_url text not null,
  creator_id uuid references auth.users on delete cascade not null,
  max_capacity integer
);

alter table public.events enable row level security;

create policy "Allow public read access to events" on public.events
  for select using (true);

create policy "Allow authenticated users to create events" on public.events
  for insert with check (auth.uid() = creator_id);

create policy "Allow event creators to update their own events" on public.events
  for update using (auth.uid() = creator_id);

create policy "Allow event creators to delete their own events" on public.events
  for delete using (auth.uid() = creator_id);


-- 3. Create RSVPs table
create table public.rsvps (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  email text not null,
  unique (event_id, email)
);

alter table public.rsvps enable row level security;

create policy "Allow public read access to RSVPs" on public.rsvps
  for select using (true);

create policy "Allow anyone to create an RSVP" on public.rsvps
  for insert with check (true);

create policy "Allow users to update their own RSVP" on public.rsvps
  for update using (auth.uid() = user_id or email = auth.email());

create policy "Allow users to delete their own RSVP" on public.rsvps
  for delete using (auth.uid() = user_id or email = auth.email());


-- 4. Create Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null
);

alter table public.comments enable row level security;

create policy "Allow public read access to comments" on public.comments
  for select using (true);

create policy "Allow authenticated users to create comments" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own comments" on public.comments
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);


-- 5. Trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, updated_at, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_metadata->>'full_name', ''), 
    new.email, 
    now(),
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || id
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-300 shadow-md mb-8" id="sql-schema-guide-box">
      
      {/* 1. Header Section */}
      <div className="border-b border-rose-500/10 bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-white dark:from-blue-950/20 dark:via-slate-900/40 dark:to-slate-950 px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/70 rounded-2xl text-blue-600 dark:text-blue-400">
            <Database className="w-6 h-6 animate-pulse" id="sql-db-icon" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Supabase Automated Table Setup
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-extrabold">
                Developer Panel
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              We can connect directly to your database and provision your database tables, index trigger-hooks, and column policies programmatically.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* OPTION A: ONE-CLICK AUTO-MIGRATOR (PROXIED ON SERVER) */}
        <section className="space-y-4" id="direct-migration-section">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <h4 className="font-display font-extrabold text-sm tracking-wide uppercase">
              Option A: Automated Database Schema Installer
            </h4>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/85 rounded-2xl p-5 space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Key className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  How does it work?
                </p>
                <p className="mt-0.5 leading-relaxed">
                  Provide your Postgres Database Connection URL. The backend Node.js engine will connect via direct tcp/pg client, compile the needed database scripts (<code className="font-mono text-blue-500">profiles</code>, <code className="font-mono text-blue-500">events</code>, <code className="font-mono text-blue-500">rsvps</code>, <code className="font-mono text-blue-500">comments</code> tables, and auth creation triggers) and activate real-time syncing.
                </p>
                <p className="mt-1 text-[11px] text-amber-500 flex items-center gap-1 font-mono">
                  🛡️ Secure: Your Connection URL never leaves our secure server-side container.
                </p>
              </div>
            </div>

            <form onSubmit={handleAutoMigrate} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  POSTGRES CONNECTION STRING (URI)
                </label>
                <input
                  type="password"
                  required
                  placeholder="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  disabled={migrating}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="submit"
                  disabled={migrating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-sm transition-all flex items-center space-x-2 shrink-0 self-start"
                  id="btn-trigger-schema-install"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning Tables...</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Execute Auto-Migration</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight md:max-w-md">
                  You can copy this connection string directly from your Supabase Dashboard under <b>Project Settings → Database → Connection string (URI)</b>.
                </p>
              </div>
            </form>

            {/* Error Message */}
            {migrateError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-start gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Migration Script Failed:</p>
                  <p className="text-[11px] leading-relaxed break-all">{migrateError}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {migrateSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-500 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Schema Installed Successfully!</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {migrateSuccess}
                </p>
                <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono italic animate-pulse">
                  🔄 Automatically reloading application state in 3 seconds to activate real-time features...
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COMPRESSION DIVIDER */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] font-extrabold font-mono tracking-widest text-slate-400 uppercase">
            OR
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* OPTION B: MANUAL SQL SCRIPT COMPONENT */}
        <section className="space-y-3" id="manual-sql-editor-section">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <h4 className="font-display font-extrabold text-sm tracking-wide uppercase">
                Option B: Manual Copy-Paste Schema Script
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1"
            >
              {isOpen ? 'Collapse Code' : 'Expand Code'}
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isOpen && (
            <div className="space-y-4" id="sql-collapse-container">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <p>If you prefer using the Supabase SQL editor manual command interface:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] pt-1 leading-normal">
                  <li>Go to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600 font-semibold">Supabase Web Console</a></li>
                  <li>Click on <b>SQL Editor</b> (the terminal console icon in the left sidebar)</li>
                  <li>Click <b>New Query</b>, paste the code snippet below, and hit <b>Run</b> at the bottom right.</li>
                </ol>
              </div>

              <div className="relative">
                <pre className="font-mono text-2sm bg-slate-950 text-slate-200 p-5 rounded-2xl overflow-x-auto max-h-[300px] leading-relaxed border border-slate-800">
                  {sqlSchema}
                </pre>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-md border border-slate-700"
                  id="copy-sql-btn"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Schema!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
