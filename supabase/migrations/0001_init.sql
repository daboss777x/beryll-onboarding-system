-- Beryll Onboard: initial schema (spec C4).
-- Progress/state only. Content (stages, tasks, answer keys, rubrics) lives in code.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('hire', 'manager', 'buddy');
create type public.stage_status as enum ('locked', 'active', 'done');
create type public.task_status as enum ('locked', 'available', 'in_progress', 'done', 'failed');
create type public.walkthrough_mode as enum ('watch', 'guided', 'solo');
create type public.certification_status as enum ('pending', 'passed', 'retest');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role public.app_role not null default 'hire',
  title text not null default '',
  avatar_url text,
  manager_id uuid references public.profiles (id) on delete set null,
  buddy_id uuid references public.profiles (id) on delete set null,
  start_date date not null default current_date,
  demo_day_offset integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index profiles_manager_id_idx on public.profiles (manager_id);
create index profiles_buddy_id_idx on public.profiles (buddy_id);

-- Create a profile when an auth user is created. Role comes from
-- raw_app_meta_data (admin-only), never from user-editable metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, title, is_demo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'hire'),
    coalesce(new.raw_user_meta_data ->> 'title', ''),
    coalesce((new.raw_app_meta_data ->> 'is_demo')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Directory + knowledge base (shared, read-only to users)
-- ---------------------------------------------------------------------------
create table public.staff_directory (
  id text primary key,
  name text not null,
  title text not null,
  team text not null,
  bio text not null default '',
  interests text[] not null default '{}',
  availability_note text not null default '',
  avatar_seed text not null default ''
);

create table public.sop_chunks (
  id text primary key,
  sop_id text not null,
  title text not null,
  text text not null,
  embedding vector(1536)
);
create index sop_chunks_sop_id_idx on public.sop_chunks (sop_id);
create index sop_chunks_embedding_idx on public.sop_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_sop_chunks(query_embedding vector(1536), match_count int default 5)
returns table (id text, sop_id text, title text, text text, similarity float)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id, c.sop_id, c.title, c.text, 1 - (c.embedding <=> query_embedding) as similarity
  from public.sop_chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

-- ---------------------------------------------------------------------------
-- Journey progress
-- ---------------------------------------------------------------------------
create table public.stage_progress (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  stage_id text not null,
  status public.stage_status not null default 'locked',
  completed_at timestamptz,
  primary key (hire_id, stage_id)
);

create table public.task_progress (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  task_id text not null,
  status public.task_status not null default 'available',
  score numeric(5, 2) check (score is null or score between 0 and 100),
  attempts integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  -- QA sampling (manager-written via set_task_qa RPC only). The QA notes are
  -- manager-only and live in public.manager_notes (subject 'qa:<task_id>').
  qa_score numeric(5, 2) check (qa_score is null or qa_score between 0 and 100),
  qa_by uuid references public.profiles (id) on delete set null,
  qa_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (hire_id, task_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id text not null,
  answers jsonb not null default '{}'::jsonb,
  score numeric(5, 2) not null default 0,
  missed_item_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index quiz_attempts_hire_idx on public.quiz_attempts (hire_id, quiz_id);

create table public.review_queue (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  quiz_id text not null,
  due_day integer not null,
  step integer not null default 0,
  last_result text check (last_result in ('correct', 'missed')),
  updated_at timestamptz not null default now(),
  primary key (hire_id, item_id)
);
create index review_queue_due_idx on public.review_queue (hire_id, due_day);

create table public.walkthrough_runs (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  walkthrough_id text not null,
  mode public.walkthrough_mode not null,
  errors integer not null default 0,
  duration_ms integer not null default 0,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);
create index walkthrough_runs_hire_idx on public.walkthrough_runs (hire_id, walkthrough_id);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  template_id text,
  client text not null,
  type text not null,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'legal_review', 'engineer_signoff', 'sent', 'signed')),
  client_id text, -- content/demo-contracts.ts client id, when seeded from content
  owner text, -- display name of the Beryll owner on the sample contract
  value_eur numeric(12, 2),
  clauses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contracts_hire_idx on public.contracts (hire_id, status);

create table public.roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  persona_id text not null,
  is_certification boolean not null default false,
  transcript jsonb not null default '[]'::jsonb,
  rubric_scores jsonb not null default '[]'::jsonb,
  overall numeric(5, 2),
  ai_summary text,
  passed boolean not null default false,
  -- 'active' while the call runs: the server holds the transcript (/api/ai/roleplay)
  -- and grades only what it stored. 'ended' once graded; end_response is replayed
  -- on a repeat `end` so a call is never re-graded.
  status text not null default 'ended' check (status in ('active', 'ended')),
  ended_at timestamptz,
  end_response jsonb,
  created_at timestamptz not null default now()
);
create index roleplay_sessions_hire_idx on public.roleplay_sessions (hire_id, created_at desc);

create table public.certifications (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  stage_id text not null,
  ai_score numeric(5, 2),
  roleplay_session_id uuid references public.roleplay_sessions (id) on delete set null,
  -- Hire-readable part of the observation (criterion scores, coaching). The free-text
  -- notes are manager-only and live in public.manager_notes (subject 'cert:<stage>:<key>').
  manager_observation jsonb check (manager_observation is null or not (manager_observation ?| array['notes', 'note'])),
  status public.certification_status not null default 'pending',
  attempts integer not null default 0,
  signed_by uuid references public.profiles (id) on delete set null,
  signed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (hire_id, stage_id)
);

-- ---------------------------------------------------------------------------
-- Manager rhythm + feedback
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  due_day integer not null,
  label text not null,
  held_at timestamptz,
  -- Check-in notes are manager-only: public.manager_notes (subject 'checkin:<due_day>').
  agenda jsonb not null default '[]'::jsonb,
  unique (hire_id, due_day)
);
create index checkins_hire_idx on public.checkins (hire_id, due_day);

-- Manager-only notes about a hire (Leah pass 2, M2). Kept out of the hire-readable
-- rows so no hire policy can expose them. Subjects:
--   'checkin:<due_day>'        notes on a check-in
--   'qa:<task_id>'             QA sampling notes on a task
--   'cert:<stage_id>:<key>'    free text from a certification observation (key notes|note)
create table public.manager_notes (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject ~ '^(checkin|qa|cert):[A-Za-z0-9_:.-]+$'),
  body text not null check (char_length(body) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (hire_id, subject)
);

create table public.pulses (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  day integer not null check (day in (7, 30, 90)),
  clarity smallint not null check (clarity between 1 and 5),
  confidence smallint not null check (confidence between 1 and 5),
  belonging smallint not null check (belonging between 1 and 5),
  comment text,
  submitted_at timestamptz not null default now(),
  primary key (hire_id, day)
);

create table public.scorecard_items (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  horizon integer not null check (horizon in (30, 60, 90)),
  goal text not null,
  target text not null default '',
  status text not null default 'not_started'
    check (status in ('not_started', 'on_track', 'at_risk', 'done')),
  note text,
  updated_at timestamptz not null default now()
);
create index scorecard_items_hire_idx on public.scorecard_items (hire_id, horizon);

-- ---------------------------------------------------------------------------
-- People + social
-- ---------------------------------------------------------------------------
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  staff_id text references public.staff_directory (id) on delete set null,
  type text not null default 'meet',
  title text not null,
  confirmed_by uuid references public.profiles (id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index quests_hire_idx on public.quests (hire_id);

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  -- Sender is either an app user (from_id) or a staff-directory colleague
  -- without an account (from_staff_id, seeded only).
  from_id uuid references public.profiles (id) on delete cascade,
  from_staff_id text references public.staff_directory (id) on delete set null,
  from_name text,
  kind text check (kind in ('peer', 'founder', 'manager')),
  to_id uuid not null references public.profiles (id) on delete cascade,
  message text not null check (char_length(message) <= 500),
  created_at timestamptz not null default now(),
  check (from_id is not null or from_staff_id is not null)
);
create index kudos_to_idx on public.kudos (to_id);
create index kudos_from_idx on public.kudos (from_id);

create table public.shadow_logs (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  interaction text not null,
  with_whom text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index shadow_logs_hire_idx on public.shadow_logs (hire_id);

create table public.sop_suggestions (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  sop_id text not null,
  suggestion text not null,
  status text not null default 'submitted' check (status in ('submitted', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);
create index sop_suggestions_hire_idx on public.sop_suggestions (hire_id);

create table public.program_reviews (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  ratings jsonb not null default '{}'::jsonb,
  comment text,
  created_at timestamptz not null default now()
);
create index program_reviews_hire_idx on public.program_reviews (hire_id);

-- ---------------------------------------------------------------------------
-- Gamification
-- ---------------------------------------------------------------------------
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.profiles (id) on delete cascade,
  source text not null,
  amount integer not null,
  created_at timestamptz not null default now(),
  unique (hire_id, source)
);
create index xp_events_hire_idx on public.xp_events (hire_id, created_at);

create table public.trophies_earned (
  hire_id uuid not null references public.profiles (id) on delete cascade,
  trophy_id text not null,
  earned_at timestamptz not null default now(),
  primary key (hire_id, trophy_id)
);

create table public.matcher_profiles (
  hire_id uuid primary key references public.profiles (id) on delete cascade,
  interests jsonb not null default '[]'::jsonb,
  visibility jsonb not null default '{}'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Server-side switches (service role only; see 0002_rls.sql)
-- ---------------------------------------------------------------------------
-- key 'demo_mode' = 'true' enables set_demo_day_offset(). The seed script writes it
-- from NEXT_PUBLIC_DEMO_MODE; with no row, demo time-skip is refused.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI rate limiting
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, feature, day)
);
