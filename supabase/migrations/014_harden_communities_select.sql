-- ════════════════════════════════════════════════════
--  014 · Endurecer SELECT de communities
--
--  Hasta ahora `communities_select` era USING (true) — cualquier
--  anon podía listar todas las comunidades y hacer bruteforce de PINs
--  con `GET /rest/v1/communities?pin=eq.XXXX`.
--
--  Ahora:
--    · Un usuario solo ve LA comunidad a la que pertenece.
--    · El super-admin sigue viendo todas (policy 013 ya lo cubre).
--    · Para login/alta, el cliente pasa por la Edge Function
--      `community-lookup` que rate-limita y devuelve solo {id, color}.
--
--  Efectos colaterales revisados:
--    · useCommunity(communityId) con user ya logueado → pasa (coincide
--      con get_user_community_id()).
--    · admin/[cid] → pasa por super-admin o por ser admin de esa comu.
--    · /admin/page.tsx (listado global) → pasa por super-admin.
--    · page.tsx handleJoin/handleCreate → sustituidos por
--      Edge Function (refactor en mismo PR).
-- ════════════════════════════════════════════════════

DROP POLICY IF EXISTS "communities_select" ON communities;
CREATE POLICY "communities_select" ON communities
  FOR SELECT
  USING (
    public.is_super_admin()
    OR id = public.get_user_community_id()
  );
