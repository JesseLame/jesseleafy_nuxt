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

create table if not exists public.ideas (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users (id) on delete cascade,
	title text not null,
	type text not null,
	description text,
	image_url text,
	reference_url text,
	notes text,
	tags text[] not null default '{}',
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.ideas
add column if not exists reference_url text;

create table if not exists public.boards (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users (id) on delete cascade,
	title text not null,
	description text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.concepts (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users (id) on delete cascade,
	board_id uuid not null references public.boards (id) on delete cascade,
	title text not null,
	version integer not null default 1,
	parent_concept_id uuid references public.concepts (id) on delete set null,
	notes text,
	created_at timestamptz not null default now()
);

create table if not exists public.board_items (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references auth.users (id) on delete cascade,
	board_id uuid not null references public.boards (id) on delete cascade,
	idea_id uuid not null references public.ideas (id) on delete cascade,
	concept_id uuid references public.concepts (id) on delete set null,
	position_x numeric not null,
	position_y numeric not null,
	width integer not null default 260,
	height integer not null default 160,
	z_index bigint not null default 1,
	style jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists ideas_owner_user_id_idx on public.ideas (owner_user_id);
create index if not exists boards_owner_user_id_idx on public.boards (owner_user_id);
create index if not exists concepts_board_id_idx on public.concepts (board_id);
create index if not exists concepts_owner_user_id_idx on public.concepts (owner_user_id);
create index if not exists board_items_board_id_idx on public.board_items (board_id);
create index if not exists board_items_concept_id_idx on public.board_items (concept_id);
create index if not exists board_items_owner_user_id_idx on public.board_items (owner_user_id);

drop trigger if exists set_ideas_updated_at on public.ideas;
create trigger set_ideas_updated_at
before update on public.ideas
for each row
execute function public.set_updated_at();

drop trigger if exists set_boards_updated_at on public.boards;
create trigger set_boards_updated_at
before update on public.boards
for each row
execute function public.set_updated_at();

drop trigger if exists set_board_items_updated_at on public.board_items;
create trigger set_board_items_updated_at
before update on public.board_items
for each row
execute function public.set_updated_at();

alter table public.ideas enable row level security;
alter table public.boards enable row level security;
alter table public.concepts enable row level security;
alter table public.board_items enable row level security;

drop policy if exists "Ideas are private to owners" on public.ideas;
create policy "Ideas are private to owners"
on public.ideas
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Boards are private to owners" on public.boards;
create policy "Boards are private to owners"
on public.boards
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Concepts are private to owners" on public.concepts;
create policy "Concepts are private to owners"
on public.concepts
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Board items are private to owners" on public.board_items;
create policy "Board items are private to owners"
on public.board_items
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('board-idea-images', 'board-idea-images', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Users can view their own board idea images" on storage.objects;
create policy "Users can view their own board idea images"
on storage.objects
for select
to authenticated
using (
	bucket_id = 'board-idea-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can upload their own board idea images" on storage.objects;
create policy "Users can upload their own board idea images"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'board-idea-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own board idea images" on storage.objects;
create policy "Users can delete their own board idea images"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'board-idea-images'
	and (storage.foldername(name))[1] = auth.uid()::text
);
