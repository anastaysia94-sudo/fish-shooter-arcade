# F.S.A. Agent / Work Instructions

Before changing this repository:

1. Read [`CANONICAL_PROJECT_CHECKPOINT.md`](CANONICAL_PROJECT_CHECKPOINT.md) in full.
2. Read [`docs/visual-reference/REFERENCE_INDEX.md`](docs/visual-reference/REFERENCE_INDEX.md).
3. For Founder Console/backend work, read [`backend/README.md`](backend/README.md) and the tracked Supabase migrations/functions.
4. Refresh the current `main` branch before editing; never overwrite newer commits with an older snapshot.
5. Treat `main` as canonical after a release is merged.
6. Make **actual runtime/code changes**. Do not substitute generated mockup images for implementation.
7. Preserve the product boundary: F.S.A. is separate from EGM4000; telemetry integration is explicit/versioned.
8. Preserve the virtual/non-cash default and the 2G/Data Saver Android fallback.
9. Preserve the production Founder Console authority boundary: Supabase Auth + PostgreSQL RLS + audited RPCs. Never restore `localStorage` as Agent/user/credit/permission authority.
10. Never place a Supabase service-role/secret key in GitHub Pages or any browser bundle. The browser may use only the publishable key under RLS.
11. Administrative Founder/Agent mutations must continue to enforce server-side scope/permissions and `aal2` MFA.
12. Run validation, fix failures, push, deploy GitHub Pages, and verify the live site before claiming a release is complete.

Primary product directive:

> **Make the actual Fish Shooter Arcade lobby, all 15 fish-shooter games, and the 20 slot-style games look and operate like the approved cinematic neon-Atlantis F.S.A. / Fish Shooter Alliance references.**
