# Cloud Sync (Minimal)

Syncs the current OdysseyOS story (story + scenes + characters) to Supabase.

## Usage

- **Sync to cloud:** Push the current project from local storage to Supabase. Use from **Session & backup** modal (user icon in sidebar) → **Sync to cloud**.
- **Load from cloud:** In the same modal, **Load from cloud** lists your cloud stories; pick one to load it as the current project (overwrites local).

## Supabase setup

1. Create three tables with RLS so each user only sees their own rows.

```sql
-- Stories (one row per story). id = text to match app ids (e.g. story-1739123456789)
create table if not exists public.stories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  summary text default '',
  word_count int default 0,
  status text default 'draft',
  metadata jsonb default '{}',
  cloud_updated_at timestamptz default now()
);

-- Scenes (many per story)
create table if not exists public.scenes (
  id text primary key,
  story_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default '',
  content text default '',
  position int default 0,
  status text default 'draft',
  word_count int default 0,
  metadata jsonb default '{}',
  cloud_updated_at timestamptz default now()
);

-- Characters (many per story)
create table if not exists public.characters (
  id text primary key,
  story_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default '',
  description text default '',
  role text default 'supporting',
  goals text default '',
  flaws text default '',
  metadata jsonb default '{}',
  cloud_updated_at timestamptz default now()
);

-- RLS
alter table public.stories enable row level security;
alter table public.scenes enable row level security;
alter table public.characters enable row level security;

create policy "Users can manage own stories"
  on public.stories for all using (auth.uid() = user_id);

create policy "Users can manage own scenes"
  on public.scenes for all using (auth.uid() = user_id);

create policy "Users can manage own characters"
  on public.characters for all using (auth.uid() = user_id);
```

## API

- `cloudSync.syncStory(storyId?)` – sync current story to cloud (optional `storyId` must match current story).
- `cloudSync.loadStoryFromCloud(storyId)` – fetch story + scenes + characters and save to local storage.
- `cloudSync.getCloudStories()` – list user’s stories in the cloud.
- `cloudSync.getLastSyncTime()` – last sync timestamp (from localStorage).
