# F.S.A. Agent / Work Instructions

Before changing this repository:

1. Read [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md) in full.
2. Read [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md).
3. For Founder Console/backend work, read [`backend/README.md`](backend/README.md) and all tracked Supabase migrations/functions.
4. Refresh current `main` before editing; never overwrite newer commits with an older snapshot.
5. Treat `main` as canonical after a release is merged.
6. Make actual runtime/code changes. Do not substitute generated mockups for implementation.
7. Preserve the product boundary: F.S.A. is separate from EGM4000.
8. Preserve the virtual/non-cash default and Android/2G fallback.
9. Preserve production authority: Supabase Auth + PostgreSQL RLS + MFA-gated audited RPCs. Never restore `localStorage` as hierarchy/credit/permission authority.
10. Preserve the hierarchy exactly: **Founder → Distributor → Agent → User**. Every Agent must have one Distributor; user authority flows through the Agent.
11. Preserve both aggregate credit guards: Agent exposure and Distributor exposure. Do not bypass either from browser, Edge Function, migration, compatibility RPC, or test helper.
12. Preserve inherited game access: Distributor → Agent → User. A child must never grant itself a game blocked by a parent.
13. Preserve role isolation: Distributor cannot see/mutate sibling Distributors; Agent cannot see/mutate sibling Agents/users. Cross-Distributor Agent reassignment is Founder-only.
14. Keep cashier, moderator, manage-Agents, and manage-users authority separate. Do not silently infer one from another.
15. Parent suspension must block effective child operator authority without deleting child records.
16. Never place a Supabase service-role/secret key in GitHub Pages or any browser bundle. The browser may use only the publishable key under RLS.
17. Administrative mutations must continue to require server-verified `aal2` MFA.
18. `fsa_credit_ledger` and `fsa_audit_log` remain immutable; corrections use compensating records.
19. Run validation, repair failures, deploy GitHub Pages, and verify the live site before calling a release complete.

Primary runtime directive:

> **Make the actual Fish Shooter Arcade lobby, all 15 fish-shooter games, and the 20 slot-style games look and operate like the approved cinematic neon-Atlantis F.S.A. / Fish Shooter Alliance references.**
