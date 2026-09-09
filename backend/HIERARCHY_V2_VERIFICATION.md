# F.S.A. Hierarchy v2 Verification

Release target: **Founder → Distributor → Agent → User**.

Verified against the connected production Supabase project with disposable transactions rolled back after each smoke test:

- `aal1` Founder credit mutation rejected with `FSA_MFA_REQUIRED`.
- `aal2` Founder created a user with 1,000 opening virtual credits.
- +200 credit adjustment succeeded.
- compensating reversal succeeded and restored final balance to 1,000.
- ledger contained exactly opening + adjustment + reversal rows.
- Distributor game reduction cascaded to Agent and User access.
- Agent ceiling overage rejected with `FSA_AGENT_CREDIT_CEILING_EXCEEDED`.
- Distributor ceiling overage rejected with `FSA_DISTRIBUTOR_CREDIT_CEILING_EXCEEDED`.
- a Distributor in a two-Distributor RLS fixture saw exactly one Distributor, one Agent and one User.
- cross-Distributor Agent update rejected with `FSA_SCOPE_DENIED`.
- no smoke-test Distributor, Agent, User, ledger or audit rows remained afterward.

Supabase advisor review:

- no hierarchy-v2 missing-FK-index warning;
- no hierarchy-v2 Auth/RLS init-plan warning;
- newly created hierarchy indexes are expected to appear as unused before real traffic;
- authenticated SECURITY DEFINER RPC notices are intentional because these are the MFA/permission/scope-checked administrative API surface;
- leaked-password protection remains an account-level Supabase Auth setting outside the available connector mutation surface.

GitHub branch gates on the final hierarchy head must pass before merge:

- `Validate F.S.A. Release`
- `Validate F.S.A. v9 Gameplay`

After merge, `main` must also pass the low-data budget and GitHub Pages deployment before the hierarchy release is declared complete.
