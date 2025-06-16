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
  country_id integer references public.countries(id) on delete cascade,
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
join public.capitals cap on cap.country_id = c.id
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