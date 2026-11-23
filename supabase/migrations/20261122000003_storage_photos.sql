-- Private bucket for capture photos (business card, product, storefront). OE-01.
-- Files live under <opportunity_id>/<file>. Only team members can read or write them;
-- the public proposal never links to this bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('opportunity-photos', 'opportunity-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "team reads photos" on storage.objects for select to authenticated
  using (bucket_id = 'opportunity-photos' and public.is_team());
create policy "team uploads photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'opportunity-photos' and public.is_team());
create policy "team deletes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'opportunity-photos' and public.is_team());
