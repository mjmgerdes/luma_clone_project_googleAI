import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

let __filename = "";
let __dirname = "";

try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  } else if (typeof __filename !== 'undefined') {
    // fallback CJS
    __filename = (globalThis as any).__filename || "";
    __dirname = (globalThis as any).__dirname || "";
  }
} catch (e) {
  // safe fallback
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Database Connection Helper
  const runMigrationQuery = async (connectionString: string) => {
    const client = new pg.Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();

    try {
      // 1. Create Profiles Table (if not exists)
      await client.query(`
        create table if not exists public.profiles (
          id uuid references auth.users on delete cascade primary key,
          updated_at timestamp with time zone default now(),
          username text unique,
          full_name text,
          avatar_url text,
          email text
        );
      `);

      // 2. Enable Row-Level Security on Profiles
      await client.query(`
        alter table public.profiles enable row level security;
      `);

      // 3. Create Profiles Policies Safely
      await client.query(`
        do $$
        begin
          if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Allow public read access to profiles') then
            create policy "Allow public read access to profiles" on public.profiles for select using (true);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Allow users to update their own profile') then
            create policy "Allow users to update their own profile" on public.profiles for update using (auth.uid() = id);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Allow users to insert their own profile') then
            create policy "Allow users to insert their own profile" on public.profiles for insert with check (auth.uid() = id);
          end if;
        end
        $$;
      `);

      // 4. Create Events Table
      await client.query(`
        create table if not exists public.events (
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
      `);

      // 5. Enable Row-level security for events
      await client.query(`
        alter table public.events enable row level security;
      `);

      // 6. Create Events Policies Safely
      await client.query(`
        do $$
        begin
          if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'Allow public read access to events') then
            create policy "Allow public read access to events" on public.events for select using (true);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'Allow authenticated users to create events') then
            create policy "Allow authenticated users to create events" on public.events for insert with check (auth.uid() = creator_id);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'Allow event creators to update their own events') then
            create policy "Allow event creators to update their own events" on public.events for update using (auth.uid() = creator_id);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'Allow event creators to delete their own events') then
            create policy "Allow event creators to delete their own events" on public.events for delete using (auth.uid() = creator_id);
          end if;
        end
        $$;
      `);

      // 7. Create RSVPs Table
      await client.query(`
        create table if not exists public.rsvps (
          id uuid default gen_random_uuid() primary key,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          event_id uuid references public.events on delete cascade not null,
          user_id uuid references auth.users on delete cascade,
          name text not null,
          email text not null,
          unique (event_id, email)
        );
      `);

      // 8. Enable Row-level security for RSVPs
      await client.query(`
        alter table public.rsvps enable row level security;
      `);

      // 9. Create RSVPs Policies Safely
      await client.query(`
        do $$
        begin
          if not exists (select 1 from pg_policies where tablename = 'rsvps' and policyname = 'Allow public read access to RSVPs') then
            create policy "Allow public read access to RSVPs" on public.rsvps for select using (true);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'rsvps' and policyname = 'Allow anyone to create an RSVP') then
            create policy "Allow anyone to create an RSVP" on public.rsvps for insert with check (true);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'rsvps' and policyname = 'Allow users to update their own RSVP') then
            create policy "Allow users to update their own RSVP" on public.rsvps for update using (auth.uid() = user_id or email = auth.email());
          end if;
          if not exists (select 1 from pg_policies where tablename = 'rsvps' and policyname = 'Allow users to delete their own RSVP') then
            create policy "Allow users to delete their own RSVP" on public.rsvps for delete using (auth.uid() = user_id or email = auth.email());
          end if;
        end
        $$;
      `);

      // 10. Create Comments Table
      await client.query(`
        create table if not exists public.comments (
          id uuid default gen_random_uuid() primary key,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          event_id uuid references public.events on delete cascade not null,
          user_id uuid references auth.users on delete cascade not null,
          content text not null
        );
      `);

      // 11. Enable Row-Level Security for Comments
      await client.query(`
        alter table public.comments enable row level security;
      `);

      // 12. Create Comments Policies Safely
      await client.query(`
        do $$
        begin
          if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'Allow public read access to comments') then
            create policy "Allow public read access to comments" on public.comments for select using (true);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'Allow authenticated users to create comments') then
            create policy "Allow authenticated users to create comments" on public.comments for insert with check (auth.uid() = user_id);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'Allow users to update their own comments') then
            create policy "Allow users to update their own comments" on public.comments for update using (auth.uid() = user_id);
          end if;
          if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'Allow users to delete their own comments') then
            create policy "Allow users to delete their own comments" on public.comments for delete using (auth.uid() = user_id);
          end if;
        end
        $$;
      `);

      // 13. Create Auth Trigger Function safely
      await client.query(`
        create or replace function public.handle_new_user()
        returns trigger as $$
        begin
          begin
            insert into public.profiles (id, full_name, email, updated_at, avatar_url)
            values (
              new.id, 
              coalesce(new.raw_user_metadata->>'full_name', ''), 
              new.email, 
              now(),
              'https://api.dicebear.com/7.x/identicon/svg?seed=' || cast(new.id as text)
            )
            on conflict (id) do update
            set email = excluded.email,
                full_name = coalesce(excluded.full_name, profiles.full_name);
          exception when others then
            -- Catch failure to prevent saving user from getting blocked
          end;
          return new;
        end;
        $$ language plpgsql security definer;
      `);

      // 14. Add Trigger on auth.users (Drop first to replace safely)
      await client.query(`
        drop trigger if exists on_auth_user_created on auth.users;
        create trigger on_auth_user_created
          after insert on auth.users
          for each row execute procedure public.handle_new_user();
      `);

    } finally {
      await client.end();
    }
  };

  // API Check Status Endpoint
  app.get("/api/db/status", async (req, res) => {
    const dcv = process.env.DATABASE_URL;
    if (!dcv) {
      return res.json({ 
        configured: false, 
        message: "No DATABASE_URL found as server-side environment secret." 
      });
    }
    
    try {
      const client = new pg.Pool({
        connectionString: dcv,
        ssl: { rejectUnauthorized: false }
      });
      const result = await client.query(`
        select exists (
          select from information_schema.tables 
          where table_schema = 'public' 
          and table_name = 'events'
        ) as events_exists;
      `);
      await client.end();
      return res.json({
        configured: true,
        eventsExists: result.rows[0].events_exists,
        message: result.rows[0].events_exists 
          ? "Database connected and tables initialized successfully." 
          : "Database connected, but tables are missing."
      });
    } catch (err: any) {
      return res.json({ 
        configured: true, 
        error: err.message, 
        message: "Failed to connect using the provided secret DATABASE_URL." 
      });
    }
  });

  // API Route to Migrate Schema Automatically
  app.post("/api/db/migrate", async (req, res) => {
    const inputUrl = req.body.connectionString || process.env.DATABASE_URL;

    if (!inputUrl || inputUrl.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        error: "No connection string specified. Please provide a DATABASE_URL." 
      });
    }

    try {
      await runMigrationQuery(inputUrl.trim());
      return res.json({ 
        success: true, 
        message: "Direct programmatic schema setup completed successfully! All tables, triggers, and Row Level Security (RLS) policies are active." 
      });
    } catch (error: any) {
      console.error("Migration Error:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
