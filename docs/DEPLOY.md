# Deploy to Vercel

For whoever puts Beryll Onboard online. Do the local setup first: [SETUP.md](SETUP.md). Supabase setup (steps in SETUP.md section 5) must be done before a Supabase-backed deploy.

**Heads-up:** the SQL migrations (`0001`, `0002`) have never been run against a real Supabase project. Do a dry run on a throwaway project first. The order is: 0001, 0002, seed, embed.

## 1. Create the project

1. Push the repo to GitHub.
2. In Vercel, click **Add New > Project** and import the repo.
3. Framework preset: **Next.js**. Leave build settings at their defaults (`npm run build`).
4. Do not deploy yet. Add the env vars first.

## 2. Environment variables

Add these under **Project > Settings > Environment Variables**, for the Production environment.

| Variable | Required | Notes |
|---|---|---|
| `DEMO_SESSION_SECRET` | **Required in production** | At least 32 characters. Generate with `openssl rand -base64 32`. Production fails closed without it. |
| `NEXT_PUBLIC_SUPABASE_URL` | For Supabase mode | Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For Supabase mode | Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | For Supabase mode | Needed for **all progress writes** in Supabase mode (tasks, scores, XP, trophies, certifications). Server only. |
| `OPENAI_API_KEY` | Optional | Server only. Without it, AI uses scripted fallbacks. |
| `OPENAI_MODEL` | Optional | Default `gpt-4.1-mini`. |
| `OPENAI_EMBED_MODEL` | Optional | Default `text-embedding-3-small`. |
| `NEXT_PUBLIC_DEMO_MODE` | Optional | Off by default. `true` allows demo features, but only together with `DEMO_MODE` below. Baked in at build time. |
| `DEMO_MODE` | Optional | Runtime switch. In production, demo features need **both** this and `NEXT_PUBLIC_DEMO_MODE` set to `true`. Unset it to turn demo off. |
| `DEMO_PASSWORD` | Required to seed in production | Password for demo accounts. `npm run seed` refuses to run in production without it. Use the **same value** here and when you seed. The default in `content/demo.ts` is public. |

**Never** give `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `DEMO_SESSION_SECRET` or `DEMO_PASSWORD` a `NEXT_PUBLIC_` prefix. That would ship them to every visitor's browser.

`NEXT_PUBLIC_*` values are inlined at build time. After changing one (including `NEXT_PUBLIC_DEMO_MODE`), redeploy.

### Demo mode on and off

Demo mode gives you login cards, the time-skip and demo-account sign-in. Demo accounts share a password, so leave it off for anything real.

- **On:** set `NEXT_PUBLIC_DEMO_MODE=true` and `DEMO_MODE=true`, then redeploy.
- **Off, no rebuild:** unset `DEMO_MODE`. The server reads it at runtime, so this takes effect straight away.
- **Off, fully:** also set `NEXT_PUBLIC_DEMO_MODE` to blank or `false` and redeploy.
- **Live Supabase:** also run this in the SQL Editor, or the database still allows the time-skip: `update public.app_settings set value = 'false' where key = 'demo_mode';`

When demo mode is off, demo accounts are refused at sign-in even with the right password, and existing demo sessions count as signed out.

If you leave the Supabase variables out, the deploy runs on the in-memory store. That works for a quick demo but state is lost between serverless instances. Use Supabase for anything shared.

## 3. Deploy

1. Click **Deploy**.
2. Wait for the build to finish.
3. Open the production URL.

## 4. Post-deploy check

1. Open `https://<your-domain>/api/health`. Expect:
   ```json
   {"ok":true,"aiMode":"live","dataMode":"supabase"}
   ```
   - `aiMode` is `fallback` if no OpenAI key is set. That is fine if intended.
   - `dataMode` is `memory` if the public Supabase variables are missing. Fix this if you meant to use Supabase.
2. Open `/login` and sign in with a demo card (only if demo mode is on, see above).
3. As the hire, complete a task, then reload. Progress should still be there. If not, check `SUPABASE_SERVICE_ROLE_KEY`.
4. Open `/api/certificate/day30` as a hire who has reached day 30, or use the time-skip. You should get a PDF.
5. If sign-in fails with a server error, check `DEMO_SESSION_SECRET` is set and at least 32 characters.
6. If the demo cards are missing or demo accounts are refused, check both `NEXT_PUBLIC_DEMO_MODE` and `DEMO_MODE` are `true`, and that you redeployed after changing the public one.

Run these from your own machine, pointed at the same Supabase project, before the first check. Order: migrations 0001 and 0002 in the SQL Editor, then `npm run seed`, then `npm run embed:sops`.

`npm run seed` refuses to run in production (`NODE_ENV` or `VERCEL_ENV` = `production`) without an explicit `DEMO_PASSWORD`. Set the same `DEMO_PASSWORD` on Vercel.

## Security headers

`next.config.ts` sets these on every route:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Content-Security-Policy` | `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |

The CSP does not restrict scripts yet. That would need nonces.

To check: `curl -I https://<your-domain>/login`

## Security: accepted risks

These are known and accepted for the demo:

- **postcss 8.4.31 inside Next 15.5.** `npm audit` flags it. It runs at build time only and cannot be reached by request input. Revisit when we move to Next 16.
- **The minimatch advisory.** It sits in dev-only lint tooling. It is not in the production bundle.

## Rolling back

In Vercel, open **Deployments**, pick the last good one and choose **Promote to Production**. Database changes are not rolled back by this.
