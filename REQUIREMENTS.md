# Requirements

Everything you need to run, develop and deploy Beryll Onboard.

## Platforms and accounts

| Platform | Purpose | Plan needed | Required? | Sign up |
|---|---|---|---|---|
| GitHub | Clone the code | Free | Yes | https://github.com/signup |
| OpenAI | Live AI (role-play, coach, grading, matcher) and SOP embeddings | Pay-as-you-go API credit | No: scripted fallbacks without it | https://platform.openai.com/signup |
| Supabase | Auth, Postgres database, row-level security, pgvector search | Free tier is enough for a demo | No: in-memory store without it | https://supabase.com/dashboard/sign-up |
| Vercel | Hosting | Hobby (free) for a demo; Pro for commercial use | Only to deploy | https://vercel.com/signup |

## Local tools

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 or later (22 LTS recommended) | Includes npm |
| npm | 10+ | `package-lock.json` is committed |
| git | any recent | |
| Playwright browsers | installed via `npx playwright install` | Only for `npm run test:e2e` |
| OpenSSL (optional) | any | To generate `DEMO_SESSION_SECRET` |

Languages: TypeScript 5 (React 19, Next.js 15), SQL (Postgres 15+ with `pgvector`), CSS (Tailwind v4).

## npm packages

### Runtime
| Package | Version | Purpose |
|---|---|---|
| next | 15.5.29 | App framework (App Router, Server Actions, route handlers, middleware) |
| react / react-dom | 19.1.0 | UI |
| @supabase/supabase-js | ^2.118.0 | Supabase client |
| @supabase/ssr | ^0.12.7 | Cookie-based Supabase auth for Next.js |
| openai | ^7.50.0 | OpenAI API (chat, structured output, embeddings) |
| zod | ^4.6.7 | Content schemas and AI output validation |
| framer-motion | ^14.9.1 | Explainers, transitions, trophy animations |
| @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities | ^6.3.1 / ^10.0.0 / ^3.2.2 | Drag and drop (approval board, clause builder, sorting exercises) |
| @react-pdf/renderer | ^4.9.0 | Day-30 and day-90 PDF certificates |
| lucide-react | ^1.68.0 | Icons |
| clsx, tailwind-merge | ^2.1.1 / ^3.7.0 | Class name helpers |
| server-only | ^0.0.1 | Build-time guard keeping secrets and answer keys off the client |

### Development
| Package | Version | Purpose |
|---|---|---|
| typescript | ^5 | Type checking |
| tailwindcss, @tailwindcss/postcss | ^4 | Styling |
| eslint, eslint-config-next, @eslint/eslintrc | ^9 / 15.5.29 / ^3 | Linting |
| vitest | ^5.1.0 | Unit tests |
| @playwright/test | ^1.64.1 | End-to-end browser tests |
| tsx | ^4.23.15 | Runs the seed and embedding scripts |
| @types/node, @types/react, @types/react-dom | ^24 / ^19 / ^19 | Type definitions |

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

| Variable | Used by | Where to get it | Required? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase → Project Settings → API | For Supabase mode |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Supabase → Project Settings → API | For Supabase mode |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (progress writes, seed, embeddings) | Supabase → Project Settings → API | For Supabase mode |
| `OPENAI_API_KEY` | Server only | platform.openai.com → API keys | For live AI |
| `OPENAI_MODEL` | Server | Choose a model (default `gpt-4.1-mini`) | No |
| `OPENAI_EMBED_MODEL` | Server, `embed:sops` | Default `text-embedding-3-small` | No |
| `NEXT_PUBLIC_DEMO_MODE` | Browser + server (baked in at build time) | Set `true` to enable demo logins and time-skip | For the demo |
| `DEMO_MODE` | Server (read at runtime) | Set `true` in production to allow demo features | For a deployed demo |
| `DEMO_SESSION_SECRET` | Server (memory-mode session cookie) | `openssl rand -base64 32` (32+ chars) | Yes in production |
| `DEMO_PASSWORD` | Server, seed | Choose your own | Recommended; required for a production seed |

## Rough running costs (estimates, check current pricing)

- **Local demo:** free.
- **Supabase:** the free tier covers a demo. Paid plans start at around US$25/month.
- **Vercel:** Hobby is free for personal/non-commercial use. Pro is around US$20 per user per month.
- **OpenAI:** usage-based. With a small model like `gpt-4.1-mini`, a role-play session or a batch of gradings typically costs cents, not dollars. Embedding the ~15 SOPs costs a fraction of a cent. Daily per-user caps in `lib/ai/guard.ts` bound the spend.
