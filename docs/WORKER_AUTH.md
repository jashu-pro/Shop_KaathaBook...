# Worker accounts and PIN sign-in

How staff sign in with their own PIN on their own phone, and how the database
enforces what each worker may do. Introduced by migration 024.

## How it works

1. **Owner adds a worker** (Settings → Staff & Access). `staff_add` stores the
   worker in `shop_memberships` with their permissions and returns a one-time
   6-digit activation code, valid for 48 hours. Only a bcrypt hash of the code
   is stored.
2. **Worker activates** on their phone: *Staff Login with PIN → First time?
   Activate PIN*, enters their phone/email, the code, and a new 4-digit PIN.
3. **The `worker-auth` Edge Function** checks the code or PIN in Postgres
   (`worker_auth_activate` / `worker_auth_verify_pin`: bcrypt, 5 wrong tries →
   15-minute lock, 30 attempts per client address per 15 minutes). Only then
   does it create the worker's own Supabase user (first time), issue a session
   for it, and record that session in `worker_sessions`.
4. **Every request** from the worker is checked by RLS through
   `has_shop_permission`: the membership must be active, the request's session
   must be the recorded one, the session version must match (revocation), and
   the session must have been active within 30 minutes.
5. **Sales, payments and stock changes** go through `record_sale`,
   `record_payment` and `adjust_stock`, which check the permission first.
   Workers cannot write balances, ledger entries, payments or stock directly.
   `record_sale` refuses totals that don't add up, and both functions take a
   request id so a repeated submission returns the first result instead of
   recording twice. They also write the activity log entry themselves.
6. **Cost prices** live in `product_costs`, readable only by the owner and
   workers with *View Cost Prices & Profit*.

Revoking (suspend, remove, sign out everywhere, PIN reset) takes effect on the
next request, even with an access token that has not expired yet.

## Deploying (test project first)

1. In the **test** project, apply migrations 001–024 in order.
2. Run `database/tests/024_worker_auth.test.sql` in its SQL editor. It rolls
   back all its own changes and ends with `ALL 024 TESTS PASSED`.
3. Dashboard → Edge Functions → *Deploy a new function* → name it
   `worker-auth`, paste `supabase/functions/worker-auth/index.ts`, deploy.
   - If the project uses the new publishable keys (`sb_publishable_…`), turn
     **Verify JWT** off for this function; it authenticates by PIN itself.
   - Optional secret `ALLOWED_ORIGINS` (comma-separated) to restrict CORS.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` are
     provided by Supabase; never put the service-role key anywhere else.
4. Create an owner account with an active shop in the test project, then run
   the end-to-end checks (values only in your shell, never committed):

   ```sh
   I_AM_NOT_PRODUCTION=1 SUPABASE_TEST_URL=… SUPABASE_TEST_ANON_KEY=… \
   TEST_OWNER_EMAIL=… TEST_OWNER_PASSWORD=… \
   node scripts/test_worker_auth_e2e.mjs
   ```
5. Point a local build at the test project and try the app flows.
6. Only after review: repeat 1–3 on production. Anonymous sign-ins are not
   needed and should stay off.

## Existing workers

Workers created before 024 lived only in the browser and are not migrated.
Any memberships with old SHA-256 hashes are reset to *invited*. The owner
adds or re-issues a code for each worker.

## Rollback

`database/rollback/024_worker_auth_and_rls.rollback.sql` restores owner-only
access, the original functions and cost prices on `products`. It leaves
business data untouched. Note it also restores the registration function's
owner-id vulnerability; keep that part of 024 unless a full rollback is needed.
