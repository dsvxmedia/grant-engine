create or replace function append_entity_document(entity_id uuid, doc_url text)
returns void
language sql
as $$
  update business_entities
  set uploaded_documents = array_append(coalesce(uploaded_documents, '{}'), doc_url)
  where id = entity_id;
$$;
