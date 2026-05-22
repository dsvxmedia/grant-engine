create extension if not exists vector;

alter table grants add column if not exists description_embedding vector(1536);
alter table business_entities add column if not exists mission_embedding vector(1536);
alter table grant_applications add column if not exists content_embedding vector(1536);

create index if not exists grants_embedding_idx
  on grants using ivfflat (description_embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists entities_embedding_idx
  on business_entities using ivfflat (mission_embedding vector_cosine_ops)
  with (lists = 10);
