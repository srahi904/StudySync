# StudySync AI — Week 1 & 2 Setup Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Push database schema
npx prisma db push

# 4. Seed the database (optional)
npm run db:seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | From GitHub Developer Settings |
| `SMTP_*` | Gmail or any SMTP provider |

---

## Database Setup (PostgreSQL)

### Option A: Local PostgreSQL
```bash
createdb studysync
# Set DATABASE_URL=postgresql://localhost:5432/studysync
```

### Option B: Neon (Free Cloud)
1. Go to neon.tech → create project
2. Copy connection string to `DATABASE_URL`

### Option C: Supabase
1. Go to supabase.com → create project  
2. Settings → Database → Connection string

---

## OAuth Setup

### Google
1. Go to https://console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### GitHub
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Callback URL: `http://localhost:3000/api/auth/callback/github`

---

## Gmail SMTP Setup

1. Enable 2FA on Gmail
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Use that as `SMTP_PASSWORD`

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx                  ← Root layout with providers
│   ├── globals.css                 ← Design tokens + Tailwind
│   ├── dashboard/page.tsx          ← Protected dashboard (Week 3)
│   │
│   ├── (auth)/                     ← Auth route group
│   │   ├── layout.tsx              ← Split layout (branding + form)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── onboarding/page.tsx
│   │
│   └── api/auth/
│       ├── [...nextauth]/route.ts  ← NextAuth handler
│       ├── signup/route.ts         ← POST: create user
│       ├── verify-email/route.ts   ← POST: verify, PUT: resend
│       ├── forgot-password/route.ts ← POST: send reset email
│       └── reset-password/route.ts ← GET: validate, POST: reset
│
├── components/
│   ├── ui/                         ← button, input, label, toast
│   ├── landing/                    ← navbar, hero, features, etc.
│   ├── auth/                       ← login-form, signup-form, etc.
│   └── providers/                  ← theme, session
│
└── lib/
    ├── auth.ts                     ← NextAuth config
    ├── prisma.ts                   ← DB client singleton
    ├── email.ts                    ← Nodemailer templates
    ├── validations.ts              ← Zod schemas
    └── utils.ts                    ← helpers (cn, tokens, etc.)
```

---

## Test Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@studysync.ai | Admin123! |
| Student | demo@studysync.ai | Student123! |

---

## Auth Flow

```
Signup → Email sent → /verify-email → Click link → /onboarding → /dashboard
Login  → Credentials or OAuth       → /dashboard
Forgot → Email sent → /reset-password?token=xxx → Login
```

---

## Next: Week 3 — Dashboard Layout + User Profile
