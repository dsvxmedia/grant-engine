-- 0012_match_grants_for_entity.sql
-- Cosine-similarity matching between one entity's mission embedding and all
-- active grant embeddings. Returns similarity in [0,1] (1 = identical).
-- Computed in-database so 1536-dim vectors never cross the wire.

create or replace function match_grants_for_entity(
  p_entity_id uuid,
  p_match_threshold double precision default 0.0,
  p_match_count integer default 1000
)
returns table (grant_id uuid, similarity double precision)
language sql
stable
set search_path = public
as $$
  select
    g.id as grant_id,
    1 - (g.description_embedding <=> e.mission_embedding) as similarity
  from grants g
  cross join (
    select mission_embedding
    from business_entities
    where id = p_entity_id
      and mission_embedding is not null
  ) e
  where g.description_embedding is not null
    and g.status = 'active'
    and 1 - (g.description_embedding <=> e.mission_embedding) >= p_match_threshold
  order by g.description_embedding <=> e.mission_embedding asc
  limit p_match_count;
$$;

revoke execute on function match_grants_for_entity(uuid, double precision, integer) from anon;
