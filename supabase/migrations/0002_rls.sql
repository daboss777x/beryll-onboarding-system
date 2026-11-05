-- Beryll Onboard: row-level security (spec C4).
-- Default: owner-only. Managers read their direct reports and write
-- checkins/certifications/QA. Buddies read a limited view of their hire and
-- confirm quests. staff_directory + sop_chunks are readable by any signed-in
-- user. No anon access anywhere.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies never recurse into profiles)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_manager_of(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target and p.manager_id = auth.uid()
  )
$$;

create or replace function public.is_buddy_of(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target and p.buddy_id = auth.uid()
  )
$$;

-- The hire's own manager/buddy (so a hire can see their names).
create or replace function public.is_my_manager_or_buddy(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.manager_id = target or p.buddy_id = target)
  )
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_manager_of(uuid) from public, anon;
revoke all on function public.is_buddy_of(uuid) from public, anon;
revoke all on function public.is_my_manager_or_buddy(uuid) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_manager_of(uuid) to authenticated;
grant execute on function public.is_buddy_of(uuid) to authenticated;
grant execute on function public.is_my_manager_or_buddy(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere and remove anon grants
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','staff_directory','sop_chunks','stage_progress','task_progress',
    'quiz_attempts','review_queue','walkthrough_runs','contracts','roleplay_sessions',
    'certifications','checkins','pulses','scorecard_items','quests','kudos',
    'shadow_logs','sop_suggestions','program_reviews','xp_events','trophies_earned',
    'matcher_profiles','ai_usage','app_settings','manager_notes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

revoke execute on function public.match_sop_chunks(vector, int) from public, anon;
grant execute on function public.match_sop_chunks(vector, int) to authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_reports on public.profiles
  for select to authenticated using (manager_id = auth.uid());
create policy profiles_select_buddy_hire on public.profiles
  for select to authenticated using (buddy_id = auth.uid());
create policy profiles_select_my_people on public.profiles
  for select to authenticated using (public.is_my_manager_or_buddy(id));
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Users may only change these columns on their own row (never role/manager/buddy).
revoke update on public.profiles from authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;
-- demo_day_offset changes only through set_demo_day_offset() (demo profiles only).

-- ---------------------------------------------------------------------------
-- Shared read-only tables
-- ---------------------------------------------------------------------------
create policy staff_directory_read on public.staff_directory
  for select to authenticated using (true);
create policy sop_chunks_read on public.sop_chunks
  for select to authenticated using (true);
revoke insert, update, delete on public.staff_directory, public.sop_chunks from authenticated;

-- ---------------------------------------------------------------------------
-- Hire-owned tables: hire full CRUD on own rows, manager read.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'stage_progress','task_progress','quiz_attempts','review_queue','walkthrough_runs',
    'contracts','roleplay_sessions','pulses','scorecard_items','shadow_logs',
    'sop_suggestions','program_reviews','xp_events','trophies_earned','matcher_profiles',
    'quests'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (hire_id = auth.uid() or public.is_manager_of(hire_id))',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (hire_id = auth.uid())',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (hire_id = auth.uid()) with check (hire_id = auth.uid())',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (hire_id = auth.uid())',
      t || '_delete_own', t);
  end loop;
end $$;

-- Scored / completion tables: READ-ONLY for users (Leah's audit).
-- Status, scores, completion, quiz/walkthrough/role-play results feed XP, unlocks,
-- trophies and certification, so a hire holding their own JWT + the public anon key
-- must not be able to write them through PostgREST. The server writes them with the
-- service role after checking the caller is the hire or the hire's manager
-- (lib/data/supabase.ts `progress()`), using values it computed itself.
-- QA columns on task_progress change only through set_task_qa().
-- review_queue (spaced-repetition schedule) and scorecard_items are written the same
-- way (lib/data/supabase.ts upsertReviewItem/removeReviewItem/upsertScorecardItem).
do $$
declare t text;
begin
  foreach t in array array['stage_progress','task_progress','quiz_attempts','review_queue','walkthrough_runs','roleplay_sessions','scorecard_items'] loop
    execute format('drop policy %I on public.%I', t || '_insert_own', t);
    execute format('drop policy %I on public.%I', t || '_update_own', t);
    execute format('drop policy %I on public.%I', t || '_delete_own', t);
    execute format('revoke insert, update, delete on public.%I from authenticated', t);
  end loop;
end $$;

-- quests: buddy sees their hire's quests; confirmation goes through confirm_quest().
create policy quests_select_buddy on public.quests
  for select to authenticated using (public.is_buddy_of(hire_id));
revoke update on public.quests from authenticated;
grant update (title, type, staff_id) on public.quests to authenticated;
-- A hire may not create a quest that is already confirmed (Leah pass 2, M3): the
-- policy rejects confirmation fields, and the column grant keeps them (and
-- created_at) out of reach entirely. Confirmed quests can't be deleted either.
drop policy quests_insert_own on public.quests;
create policy quests_insert_own on public.quests
  for insert to authenticated
  with check (hire_id = auth.uid() and confirmed_at is null and confirmed_by is null);
revoke insert on public.quests from authenticated;
grant insert (hire_id, staff_id, type, title) on public.quests to authenticated;
drop policy quests_delete_own on public.quests;
create policy quests_delete_own on public.quests
  for delete to authenticated using (hire_id = auth.uid() and confirmed_at is null);

-- matcher_profiles: no direct buddy select (Leah's audit). A buddy sees only what
-- the hire made visible, through buddy_matcher_profile() below.

-- app_settings: no user access at all (RLS on, no policies); read by definer functions.
revoke all on public.app_settings from authenticated;

-- xp_events/trophies: read-only for users. Awards are written server-side with
-- the service role (lib/data/supabase.ts addXpEvent/awardTrophy), so a hire
-- cannot mint their own XP or trophies with the anon key.
drop policy xp_events_insert_own on public.xp_events;
drop policy trophies_earned_insert_own on public.trophies_earned;
revoke insert, update, delete on public.xp_events, public.trophies_earned from authenticated;
drop policy xp_events_update_own on public.xp_events;
drop policy xp_events_delete_own on public.xp_events;
drop policy trophies_earned_update_own on public.trophies_earned;
drop policy trophies_earned_delete_own on public.trophies_earned;
-- pulses: written only by the server (service role, lib/data/supabase.ts submitPulse)
-- after the server action checked the hire's program day has reached the pulse day
-- (Leah pass 2, M3). Users read only; immutable once submitted.
drop policy pulses_insert_own on public.pulses;
drop policy pulses_update_own on public.pulses;
drop policy pulses_delete_own on public.pulses;
revoke insert, update, delete on public.pulses from authenticated;

-- ---------------------------------------------------------------------------
-- certifications: the hire reads only. The AI score is written server-side
-- (service role, /api/ai/roleplay); a hire-writable row would let the hire set
-- ai_score / manager_observation themselves. The manager decides the outcome.
-- ---------------------------------------------------------------------------
create policy certifications_select on public.certifications
  for select to authenticated using (hire_id = auth.uid() or public.is_manager_of(hire_id));
create policy certifications_insert_manager on public.certifications
  for insert to authenticated with check (public.is_manager_of(hire_id));
create policy certifications_update_manager on public.certifications
  for update to authenticated
  using (public.is_manager_of(hire_id)) with check (public.is_manager_of(hire_id));

-- ---------------------------------------------------------------------------
-- manager_notes: the hire's manager only (Leah pass 2, M2). Hires and buddies have
-- no policy, so check-in notes, QA notes and certification observation notes are
-- invisible to them through PostgREST. set_task_qa() writes QA notes; the seed and
-- system writes use the service role.
-- ---------------------------------------------------------------------------
create policy manager_notes_select on public.manager_notes
  for select to authenticated using (public.is_manager_of(hire_id));
create policy manager_notes_insert on public.manager_notes
  for insert to authenticated with check (public.is_manager_of(hire_id));
create policy manager_notes_update on public.manager_notes
  for update to authenticated
  using (public.is_manager_of(hire_id)) with check (public.is_manager_of(hire_id));
create policy manager_notes_delete on public.manager_notes
  for delete to authenticated using (public.is_manager_of(hire_id));

-- ---------------------------------------------------------------------------
-- checkins: hire reads own (no notes: those are in manager_notes); manager full write.
-- ---------------------------------------------------------------------------
create policy checkins_select on public.checkins
  for select to authenticated using (hire_id = auth.uid() or public.is_manager_of(hire_id));
create policy checkins_insert_manager on public.checkins
  for insert to authenticated with check (public.is_manager_of(hire_id));
create policy checkins_update_manager on public.checkins
  for update to authenticated
  using (public.is_manager_of(hire_id)) with check (public.is_manager_of(hire_id));
create policy checkins_delete_manager on public.checkins
  for delete to authenticated using (public.is_manager_of(hire_id));

-- ---------------------------------------------------------------------------
-- kudos: sender writes; sender, recipient and recipient's manager read.
-- ---------------------------------------------------------------------------
create policy kudos_select on public.kudos
  for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid() or public.is_manager_of(to_id));
-- Insert only to someone you work with (Leah pass 2, L5): a buddy or manager to their
-- hire, or a hire to their own manager or buddy. kind/from_name/from_staff_id/created_at
-- are seed-only (column grant), so a user can't forge a 'founder' kudos.
create policy kudos_insert on public.kudos
  for insert to authenticated with check (
    from_id = auth.uid() and to_id <> auth.uid() and from_staff_id is null
    and (public.is_buddy_of(to_id) or public.is_manager_of(to_id) or public.is_my_manager_or_buddy(to_id))
  );
revoke insert, update, delete on public.kudos from authenticated;
grant insert (from_id, to_id, message) on public.kudos to authenticated;

-- ---------------------------------------------------------------------------
-- ai_usage: read own; writes only through increment_ai_usage().
-- ---------------------------------------------------------------------------
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.ai_usage from authenticated;

-- ---------------------------------------------------------------------------
-- RPCs (security definer, each checks the caller itself)
-- ---------------------------------------------------------------------------

-- Buddy view of their hire: limited fields, no scores or drafts.
create or replace function public.buddy_hire_summary()
returns table (
  hire_id uuid, name text, title text, avatar_url text, start_date date,
  demo_day_offset int, tasks_done int, quests_open int
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.name, p.title, p.avatar_url, p.start_date, p.demo_day_offset,
    (select count(*)::int from public.task_progress t where t.hire_id = p.id and t.status = 'done'),
    (select count(*)::int from public.quests q where q.hire_id = p.id and q.confirmed_at is null)
  from public.profiles p
  where p.buddy_id = auth.uid()
$$;

create or replace function public.confirm_quest(p_quest_id uuid)
returns public.quests
language plpgsql security definer set search_path = public
as $$
declare q public.quests;
begin
  select * into q from public.quests where id = p_quest_id;
  if q.id is null then raise exception 'quest not found'; end if;
  if not (public.is_buddy_of(q.hire_id) or public.is_manager_of(q.hire_id)) then
    raise exception 'not allowed';
  end if;
  update public.quests set confirmed_by = auth.uid(), confirmed_at = now()
    where id = p_quest_id and confirmed_at is null
    returning * into q;
  return q;
end;
$$;

create or replace function public.set_task_qa(p_hire_id uuid, p_task_id text, p_score numeric, p_notes text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_manager_of(p_hire_id) then raise exception 'not allowed'; end if;
  update public.task_progress
    set qa_score = p_score, qa_by = auth.uid(), qa_at = now(), updated_at = now()
    where hire_id = p_hire_id and task_id = p_task_id;
  if not found then return; end if;
  -- QA notes are manager-only (manager_notes), never on the hire-readable row.
  if coalesce(p_notes, '') = '' then
    delete from public.manager_notes where hire_id = p_hire_id and subject = 'qa:' || p_task_id;
  else
    insert into public.manager_notes (hire_id, subject, body)
      values (p_hire_id, 'qa:' || p_task_id, left(p_notes, 4000))
    on conflict (hire_id, subject) do update set body = excluded.body, updated_at = now();
  end if;
end;
$$;

-- Buddy view of their hire's matcher profile: interests only, and only the ones the
-- hire made visible (visibility.interests = true shows all; else per 'interest:<x>').
-- Suggestions and the visibility map itself stay private.
create or replace function public.buddy_matcher_profile()
returns table (hire_id uuid, interests jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select m.hire_id,
    coalesce((
      select jsonb_agg(i.value order by i.ordinality)
      from jsonb_array_elements_text(m.interests) with ordinality as i(value, ordinality)
      where coalesce((m.visibility ->> 'interests')::boolean, false)
         or coalesce((m.visibility ->> ('interest:' || i.value))::boolean, false)
    ), '[]'::jsonb),
    m.updated_at
  from public.matcher_profiles m
  join public.profiles p on p.id = m.hire_id
  where p.buddy_id = auth.uid()
$$;

-- Demo mode switch (app_settings 'demo_mode', written by the seed from NEXT_PUBLIC_DEMO_MODE).
create or replace function public.demo_mode_enabled()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select (value #>> '{}')::boolean from public.app_settings where key = 'demo_mode'), false)
$$;
revoke all on function public.demo_mode_enabled() from public, anon, authenticated;

-- Time-skip: only when demo mode is on; a demo user on themselves, or a manager on a demo hire they manage.
create or replace function public.set_demo_day_offset(p_hire_id uuid, p_offset int)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.demo_mode_enabled() then
    raise exception 'demo mode is off';
  end if;
  if not exists (select 1 from public.profiles where id = p_hire_id and is_demo) then
    raise exception 'not a demo profile';
  end if;
  if not (p_hire_id = auth.uid() or public.is_manager_of(p_hire_id)) then
    raise exception 'not allowed';
  end if;
  update public.profiles set demo_day_offset = greatest(p_offset, 0) where id = p_hire_id;
end;
$$;

create or replace function public.increment_ai_usage(p_feature text)
returns int
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.ai_usage (user_id, feature, day, count)
    values (auth.uid(), p_feature, current_date, 1)
  on conflict (user_id, feature, day) do update set count = public.ai_usage.count + 1
  returning count into n;
  return n;
end;
$$;

-- Role-play transcript append (server only). One UPDATE checks owner, status and the
-- user-turn limit, so parallel requests can't exceed it. Called with the service role
-- by lib/data/supabase.ts appendRoleplayTurns after progress() checked the caller.
create or replace function public.append_roleplay_turns(p_session_id uuid, p_hire_id uuid, p_turns jsonb, p_max_user_turns int)
returns setof public.roleplay_sessions
language sql security definer set search_path = public
as $$
  update public.roleplay_sessions s
    set transcript = s.transcript || p_turns
    where s.id = p_session_id and s.hire_id = p_hire_id and s.status = 'active'
      and jsonb_typeof(p_turns) = 'array'
      and (p_max_user_turns is null
        or (select count(*) from jsonb_array_elements(s.transcript) e where e ->> 'role' = 'user') < p_max_user_turns)
    returning s.*
$$;
revoke all on function public.append_roleplay_turns(uuid, uuid, jsonb, int) from public, anon, authenticated;
grant execute on function public.append_roleplay_turns(uuid, uuid, jsonb, int) to service_role;

do $$
declare f text;
begin
  foreach f in array array[
    'buddy_hire_summary()',
    'buddy_matcher_profile()',
    'confirm_quest(uuid)',
    'set_task_qa(uuid, text, numeric, text)',
    'set_demo_day_offset(uuid, int)',
    'increment_ai_usage(text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
