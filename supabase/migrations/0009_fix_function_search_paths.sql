-- Fix mutable search_path on both functions (Supabase security advisor warning).
-- Without a pinned search_path a rogue schema earlier in the path could shadow
-- public objects, so we lock both functions to the public schema.

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function append_entity_document(entity_id uuid, doc_url text)
returns void
language sql
set search_path = 'public'
as $$
  update public.business_entities
  set uploaded_documents = array_append(coalesce(uploaded_documents, '{}'), doc_url)
  where id = entity_id;
$$;
