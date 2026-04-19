insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update
set
	name = excluded.name,
	public = excluded.public;

drop policy if exists "Recipe images are public readable" on storage.objects;
create policy "Recipe images are public readable"
on storage.objects
for select
to public
using (bucket_id = 'recipe-images');

drop policy if exists "Admins can upload recipe images" on storage.objects;
create policy "Admins can upload recipe images"
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'recipe-images'
	and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	and (storage.foldername(name))[1] = 'recipes'
);

drop policy if exists "Admins can delete recipe images" on storage.objects;
create policy "Admins can delete recipe images"
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'recipe-images'
	and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	and (storage.foldername(name))[1] = 'recipes'
);
