-- LoWa Opportunity Engine: schema, RLS and helpers (OE-01).
-- Every table is private: only signed-in team members (table team_members) can read or write.
-- The public proposal page never reads these tables with the user's key: the server reads
-- proposal_snapshots by token with the service role and returns only the public JSON.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- enums
create type opportunity_status as enum (
  'captured', 'researching', 'needs_verification', 'draft_ready', 'published',
  'contacted', 'interested', 'follow_up', 'won', 'lost'
);
create type confidence_level as enum ('high', 'medium', 'low');
create type found_via as enum ('in_person', 'online');
create type proposal_template as enum ('missing_website', 'growth', 'seasonal');
create type research_step as enum ('photo', 'identity', 'website', 'social', 'context', 'analysis', 'draft');
create type job_status as enum ('queued', 'running', 'done', 'failed');
create type finding_kind as enum (
  'website', 'google', 'instagram', 'facebook', 'store', 'contact', 'review',
  'catalog', 'competitor', 'context', 'photo', 'note'
);
create type verification_status as enum ('verified', 'unverified', 'rejected');
create type finding_origin as enum ('auto', 'manual');
create type price_type as enum ('fixed', 'from', 'monthly', 'custom');
create type proposal_status as enum ('draft', 'published', 'revoked');
create type outreach_kind as enum ('personal', 'instagram_dm', 'email');

-- ---------------------------------------------------------------- team
-- Who can use /discover. Managed by Sarah in the Supabase dashboard (SQL or table editor).
create table team_members (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function is_team() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from team_members
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------- helpers
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- opportunities
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  -- Set by the phone when the lead is captured offline, so a retried sync never duplicates it.
  client_ref uuid unique,
  name text not null check (length(trim(name)) between 1 and 160),
  name_norm text generated always as (lower(trim(name))) stored,
  city text not null check (length(trim(city)) between 1 and 120),
  region text,
  country text not null default 'US',
  website text,
  instagram text,
  category text,
  contact_name text,
  business_email text,
  business_email_verified boolean not null default false,
  found_at text,
  observation text,
  found_via found_via,
  status opportunity_status not null default 'captured',
  confidence confidence_level,
  identity_confirmed boolean not null default false,
  template proposal_template,
  captured_at timestamptz not null default now(),
  contacted_at timestamptz,
  notes text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opportunities_status_idx on opportunities (status, updated_at desc);
create index opportunities_name_trgm_idx on opportunities using gin (name_norm gin_trgm_ops);
create trigger opportunities_touch before update on opportunities
  for each row execute function touch_updated_at();

create table opportunity_photos (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  storage_path text not null unique,
  extracted jsonb,
  ok_to_use boolean not null default false,
  created_at timestamptz not null default now()
);
create index opportunity_photos_opp_idx on opportunity_photos (opportunity_id);

-- ---------------------------------------------------------------- status history
create table status_history (
  id bigint generated always as identity primary key,
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  from_status opportunity_status,
  to_status opportunity_status not null,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now(),
  note text
);
create index status_history_opp_idx on status_history (opportunity_id, changed_at desc);

create or replace function log_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into status_history (opportunity_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into status_history (opportunity_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create trigger opportunities_status_log after insert or update of status on opportunities
  for each row execute function log_status_change();

-- First move to "contacted" stamps the contact date.
create or replace function stamp_contacted_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'contacted' and new.contacted_at is null then
    new.contacted_at := now();
  end if;
  return new;
end;
$$;
create trigger opportunities_contacted before update of status on opportunities
  for each row execute function stamp_contacted_at();

-- ---------------------------------------------------------------- research
create table research_jobs (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  step research_step not null,
  status job_status not null default 'queued',
  attempts smallint not null default 0 check (attempts between 0 and 10),
  error text,
  result jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (opportunity_id, step)
);
create index research_jobs_pending_idx on research_jobs (status, created_at) where status in ('queued', 'failed');

create table research_findings (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  kind finding_kind not null,
  finding text not null,
  source_url text check (source_url is null or source_url ~* '^https?://'),
  verification verification_status not null default 'unverified',
  confidence confidence_level not null default 'medium',
  origin finding_origin not null default 'auto',
  data jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index research_findings_opp_idx on research_findings (opportunity_id, kind);

create table analyses (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  version integer not null,
  dimensions jsonb not null,
  insights jsonb not null check (jsonb_typeof(insights) = 'array' and jsonb_array_length(insights) <= 3),
  service_slug text,
  extra_pages smallint not null default 0 check (extra_pages between 0 and 20),
  template proposal_template,
  model text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, version)
);

-- ---------------------------------------------------------------- catalog
create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  category text not null,
  price_type price_type not null,
  price_cents integer check (price_cents is null or price_cents >= 0),
  extra_page_cents integer check (extra_page_cents is null or extra_page_cents >= 0),
  included_pages smallint,
  currency text not null default 'USD',
  summary text,
  payment_terms text,
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  delivery text,
  notes text,
  active boolean not null default true,
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now(),
  -- A priced service needs a price before it can be offered.
  constraint services_priced check (price_type = 'custom' or not active or price_cents is not null)
);
create trigger services_touch before update on services
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- proposals
create table proposals (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  version integer not null,
  template proposal_template not null,
  service_slug text not null,
  extra_pages smallint not null default 0,
  content jsonb not null,
  status proposal_status not null default 'draft',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (opportunity_id, version),
  constraint proposals_published_approved check (status <> 'published' or approved_at is not null)
);

-- Public, frozen copy of a published proposal. Only what the client sees, price already computed.
create table proposal_snapshots (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{22}$'),
  proposal_id uuid not null references proposals (id) on delete cascade,
  public_content jsonb not null,
  published_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days',
  revoked_at timestamptz
);
create index proposal_snapshots_proposal_idx on proposal_snapshots (proposal_id);

create table outreach_messages (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  kind outreach_kind not null,
  body text not null,
  edited boolean not null default false,
  copied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, kind)
);
create trigger outreach_touch before update on outreach_messages
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- duplicates
-- Similar names in the same city (case and accent insensitive enough for a warning, never a block).
create or replace function similar_opportunities(p_name text, p_city text)
returns table (id uuid, name text, city text, status opportunity_status, captured_at timestamptz, score real)
language sql stable security invoker set search_path = public as $$
  select o.id, o.name, o.city, o.status, o.captured_at, similarity(o.name_norm, lower(trim(p_name))) as score
  from opportunities o
  where lower(trim(o.city)) = lower(trim(p_city))
    and similarity(o.name_norm, lower(trim(p_name))) >= 0.45
  order by score desc
  limit 3;
$$;

-- ---------------------------------------------------------------- row level security
do $$
declare t text;
begin
  foreach t in array array[
    'team_members', 'opportunities', 'opportunity_photos', 'status_history', 'research_jobs',
    'research_findings', 'analyses', 'services', 'proposals', 'proposal_snapshots', 'outreach_messages'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon', t);
  end loop;

  foreach t in array array[
    'opportunities', 'opportunity_photos', 'research_jobs', 'research_findings', 'analyses',
    'services', 'proposals', 'proposal_snapshots', 'outreach_messages'
  ] loop
    execute format(
      'create policy team_all on %I for all to authenticated using (is_team()) with check (is_team())', t
    );
  end loop;
end $$;

-- History is written by the trigger only; the team can read it.
create policy team_read on status_history for select to authenticated using (is_team());
-- The team list is read-only through the API; edit it in the dashboard.
create policy team_read on team_members for select to authenticated using (is_team());

revoke all on function similar_opportunities(text, text) from anon;
revoke all on function is_team() from anon;
