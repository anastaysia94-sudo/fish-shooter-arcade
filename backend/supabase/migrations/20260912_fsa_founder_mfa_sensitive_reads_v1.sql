-- F.S.A. Founder Console completion hardening
-- Founder sessions may identify themselves at AAL1, but sensitive hierarchy,
-- credit, permission and audit reads require AAL2. Non-Founder operator/player
-- scope continues to be decided by the existing permissive RLS policies.

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_distributors;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_distributors
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_agents;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_agents
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_players;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_players
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_distributor_game_access;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_distributor_game_access
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_agent_game_access;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_agent_game_access
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_player_game_access;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_player_game_access
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_credit_ledger;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_credit_ledger
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');

DROP POLICY IF EXISTS fsa_founder_mfa_sensitive_read ON public.fsa_audit_log;
CREATE POLICY fsa_founder_mfa_sensitive_read ON public.fsa_audit_log
AS RESTRICTIVE FOR SELECT TO authenticated
USING (coalesce((select fsa_private.session_role()),'') <> 'founder' OR coalesce((select auth.jwt()->>'aal'),'aal1') = 'aal2');
