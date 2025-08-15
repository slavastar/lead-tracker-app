# Lead Tracker App

A full-stack TypeScript project for managing sales leads, generating AI-assisted cold emails, and selling credits via Stripe. The stack includes **React + Tailwind**, **Express + Prisma**, **Supabase Postgres**, **OpenAI**, and **Stripe**.

---

## Directory structure

```
LEAD_TRACKER
├── backend
│   ├── node_modules
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src
│   │   ├── config
│   │   ├── routes
│   │   │   ├── analytics.ts
│   │   │   ├── leads.ts
│   │   │   ├── payments.ts
│   │   │   ├── templates.ts
│   │   │   ├── users.ts
│   │   │   └── webhooks.ts
│   │   ├── utils
│   │   └── index.ts
│   ├── .env
│   ├── package-lock.json
│   └── package.json
├── frontend
│   ├── node_modules
│   ├── public
│   ├── src
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
└── supabase
```

## Features
The following features have been implemented:
- Authentication
- Viewing and adding leads
- Email generation
- Credit system (1 request = 1 credit)
- Purchase credits via Stripe
- View credits on the dashboard with Chart.js
- All data stored in Supabase with schema defined using Prisma and RLS enabled for secure access
- Prompt logging & versioning
- Prompt moderation & validation using Zod

---

## Run the app

## 1) Create environment variables

### `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SUPABASE_URL=http://localhost:54321
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres
OPENAI_API_KEY=sk-proj-...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_1...
STRIPE_WEBHOOK_SECRET=whsec_...

FRONTEND_URL=http://localhost:3000
```

---

## 2) Launching the app (local development)

In the root project folder, run:

```bash
# Build & start frontend + backend
docker compose --env-file ./frontend/.env up --build

# Start local Supabase
supabase start

# Start Stripe webhook listener
stripe listen --forward-to localhost:4000/api/webhook
```

---

## 3) Database (Prisma + Supabase)

The backend uses [Prisma](https://www.prisma.io/) ORM with Supabase Postgres.

### Generate Prisma client

Whenever you change `prisma/schema.prisma`:

```bash
cd backend
npx prisma generate
```

### 4) Run the app
The app is running on [http://localhost:3000](http://localhost:3000)