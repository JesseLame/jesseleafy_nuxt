create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create table if not exists public.recipes (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	status text not null default 'published' check (status in ('draft', 'published', 'archived')),
	image_path text,
	category text,
	tags text[] not null default '{}',
	created_on date not null,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.recipe_translations (
	id uuid primary key default gen_random_uuid(),
	recipe_id uuid not null references public.recipes (id) on delete cascade,
	locale text not null check (locale in ('en', 'nl')),
	title text not null,
	description text not null,
	body_markdown text,
	ingredient_sections jsonb not null default '[]'::jsonb,
	instruction_steps jsonb not null default '[]'::jsonb,
	nutrition jsonb,
	metadata jsonb not null default '{}'::jsonb,
	unique (recipe_id, locale)
);

create table if not exists public.authors (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	display_name text not null,
	bio text,
	avatar_path text,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.recipe_authors (
	recipe_id uuid not null references public.recipes (id) on delete cascade,
	author_id uuid not null references public.authors (id) on delete cascade,
	sort_order integer not null default 0,
	primary key (recipe_id, author_id)
);

create index if not exists recipes_status_idx on public.recipes (status);
create index if not exists recipes_category_idx on public.recipes (category);
create index if not exists recipes_created_on_idx on public.recipes (created_on desc);
create index if not exists recipe_translations_recipe_id_idx on public.recipe_translations (recipe_id);
create index if not exists recipe_translations_locale_idx on public.recipe_translations (locale);
create index if not exists authors_display_name_idx on public.authors (display_name);
create index if not exists recipe_authors_recipe_id_idx on public.recipe_authors (recipe_id);
create index if not exists recipe_authors_author_id_idx on public.recipe_authors (author_id);

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

drop trigger if exists set_authors_updated_at on public.authors;
create trigger set_authors_updated_at
before update on public.authors
for each row
execute function public.set_updated_at();

alter table public.recipes enable row level security;
alter table public.recipe_translations enable row level security;
alter table public.authors enable row level security;
alter table public.recipe_authors enable row level security;

drop policy if exists "Published recipes are public readable" on public.recipes;
create policy "Published recipes are public readable"
on public.recipes
for select
to public
using (status = 'published');

drop policy if exists "Published recipe translations are public readable" on public.recipe_translations;
create policy "Published recipe translations are public readable"
on public.recipe_translations
for select
to public
using (
	exists (
		select 1
		from public.recipes
		where public.recipes.id = public.recipe_translations.recipe_id
			and public.recipes.status = 'published'
	)
);

drop policy if exists "Authors are public readable" on public.authors;
drop policy if exists "Authors linked to published recipes are public readable" on public.authors;
create policy "Authors linked to published recipes are public readable"
on public.authors
for select
to public
using (
	exists (
		select 1
		from public.recipe_authors
		join public.recipes on public.recipes.id = public.recipe_authors.recipe_id
		where public.recipe_authors.author_id = public.authors.id
			and public.recipes.status = 'published'
	)
);

drop policy if exists "Published recipe authors are public readable" on public.recipe_authors;
create policy "Published recipe authors are public readable"
on public.recipe_authors
for select
to public
using (
	exists (
		select 1
		from public.recipes
		where public.recipes.id = public.recipe_authors.recipe_id
			and public.recipes.status = 'published'
	)
);
