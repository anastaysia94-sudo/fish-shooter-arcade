# F.S.A. Founder Backend v1 — Completion Pass (2026-09-12)

This checkpoint closes the remaining code/configuration gaps from production backend #1 on top of the newer Founder → Distributor → Agent → User hierarchy.

## Completed in this pass

- Founder sensitive hierarchy, credit, game-access and audit reads now require MFA/AAL2 through restrictive RLS policies. Existing Distributor, Agent and player scoping remains governed by the hierarchy RLS policies.
- Password recovery no longer depends exclusively on the Supabase project redirect allowlist. If an email action lands on an outdated localhost Site URL, the full recovery link can be pasted into the Founder Console and its one-time recovery token is verified directly against this project.
- Password creation/recovery in the Founder Console screens new passwords against Have I Been Pwned Pwned Passwords using SHA-1 k-anonymity. Only the first five hash characters are sent to HIBP, with response padding requested. The plaintext password and full hash are not sent to HIBP.
- Password changes sign out browser sessions and require a fresh login plus MFA.
- Founder Console sessions auto-sign-out after 30 minutes of inactivity.
- The new security module is network-first in the service worker and included in the offline shell.
- Regression validation covers the recovery fallback, password screening module and Founder MFA read-gate migration.

## Supabase plan note

The connected Supabase organization is on the Free plan. Supabase's built-in leaked-password protection is a Pro-plan feature, so F.S.A. implements its own k-anonymous Pwned Passwords screening rather than requiring a paid-plan change.

## Human-owned final activation

The database currently has an active Founder operator but no verified MFA factor. The software can create the TOTP enrollment secret and enforce it, but the factor must be enrolled into an authenticator controlled by the Founder. Do not automate or escrow that secret in source code, database migrations, chat logs, or CI.

Open `/admin/`, sign in, choose **Security → Set up authenticator**, scan the QR code in the authenticator app, then enter the current code. After verification, the session becomes AAL2 and Founder sensitive reads/writes unlock.
