-- explore-capitals schema (excerpt)

-- Countries table -----------------------------------------------------
create table if not exists public.countries (
  id serial primary key,
  "Country Name" text not null,
  "Official Name" text,
  "Flag Emoji" text
);

-- Capitals table ------------------------------------------------------
create table if not exists public.capitals (
  id serial primary key,
  country_code integer references public.countries(id) on delete cascade,
  capital_name text not null
);

-- Example stored procedure for the quiz ------------------------------
create or replace function public.get_random_countries_with_capitals(count integer default 10)
returns table(
  country_name text,
  capital_name text
) as $$
select c."Country Name" as country_name,
       cap.capital_name as capital_name
from public.countries c
join public.capitals cap on cap.country_code = c.id
order by random()
limit count;
$$ language sql stable;

-- Row-level security --------------------------------------------------
alter table public.countries enable row level security;
alter table public.capitals enable row level security;

create policy "Public read access" on public.countries
  for select using (true);

create policy "Public read access" on public.capitals
  for select using (true);

-- Site statistics -----------------------------------------------------
create table if not exists public.site_statistics (
  country_name text primary key,
  search_count integer not null default 0,
  last_searched_at timestamptz default now()
);

alter table public.site_statistics enable row level security;
create policy "Public read access" on public.site_statistics
  for select using (true);
create policy "Public upsert" on public.site_statistics
  for insert with check (true);
create policy "Public update" on public.site_statistics
  for update using (true);

-- helper function to increment search count ---------------------------
create or replace function public.increment_search(p_country text)
returns void as $$
insert into public.site_statistics as s (country_name, search_count, last_searched_at)
values (p_country, 1, now())
on conflict (country_name)
  do update set search_count = s.search_count + 1, last_searched_at = now();
$$ language sql security definer; 