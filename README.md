# Paperset

AI-powered exam practice tool. Paste your study notes, generate a custom practice exam, get graded by AI, and chat with an AI tutor on questions you got wrong.

## Stack

- **Frontend**: React + Vite (TypeScript), Tailwind CSS, shadcn/ui
- **Backend**: Express 5 (TypeScript), served via Node.js
- **AI**: Groq API (`llama-3.3-70b-versatile`) for exam generation and grading
- **Auth & DB**: Supabase (email/password + Google OAuth, PostgreSQL)
- **Monorepo**: pnpm workspaces

## Environment Variables

### API Server (`artifacts/api-server`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key — get one free at [console.groq.com](https://console.groq.com) |
| `PORT` | Yes | Port the server listens on (set automatically in Replit/Vercel) |
| `SESSION_SECRET` | Optional | Secret for session signing (if sessions are added later) |

### Frontend (`artifacts/paperset`)

These are baked into the Vite bundle at build time via `vite.config.ts` `define`:

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL — found in Supabase dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key — found in Supabase dashboard → Settings → API |
| `PORT` | Yes | Port Vite dev server listens on |
| `BASE_PATH` | Yes | URL base path — use `/` for root deployments |

## Supabase Setup

Run the following SQL in your Supabase dashboard (SQL Editor):

```sql
-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  curriculum text not null,
  year text not null,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Exams table
create table exams (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  score_pct integer not null,
  total_questions integer not null,
  correct_answers numeric not null,
  questions jsonb,
  created_at timestamptz default now()
);
alter table exams enable row level security;
create policy "Users can view own exams" on exams for select using (auth.uid() = user_id);
create policy "Users can insert own exams" on exams for insert with check (auth.uid() = user_id);
create policy "Users can delete own exams" on exams for delete using (auth.uid() = user_id);
```

For Google OAuth: enable the Google provider in Supabase → Authentication → Providers → Google.

## Local Development

```bash
# Install dependencies
pnpm install

# Run the API server (port 5000 by default)
pnpm --filter @workspace/api-server run dev

# Run the frontend (in a separate terminal)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/paperset run dev
```

The frontend expects the API server to be reachable at `/api`. In local dev, configure a proxy or run both through a reverse proxy.

## Deploying to Vercel

Vercel supports monorepos. You will need to deploy **two projects**:

### 1. API Server (Serverless / Node)

- Root directory: `artifacts/api-server`
- Build command: `pnpm run build`
- Output: `dist/index.mjs`
- Framework preset: Other
- Environment variables: `GROQ_API_KEY`

### 2. Frontend (Static)

- Root directory: `artifacts/paperset`
- Build command: `pnpm run build`
- Output directory: `dist/public`
- Framework preset: Vite
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BASE_PATH=/`, `PORT=3000`

> **Important**: The frontend calls `/api/...` — you'll need to configure a Vercel rewrite in `vercel.json` in the paperset directory to proxy `/api` to your deployed API server URL.

### Example `artifacts/paperset/vercel.json`

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-api-server.vercel.app/api/$1" }
  ]
}
```

## Build

```bash
# Typecheck everything
pnpm run typecheck

# Build all packages
pnpm run build
```
