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

---

## Run the app

### 0) Prerequisites

- Node.js 18+ and npm
- A Supabase project (for Postgres)
- An OpenAI API key
- A Stripe test account (with a **Price** created)

**Install dependencies in both apps first:**
```bash
cd frontend && npm install
cd ../backend && npm install
```

---

### 1) Environment variables

Create the following files **before** starting the servers.

**`frontend/.env`**
```env
REACT_APP_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=
```

**`backend/.env`**
```env
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT_ID>.supabase.co:5432/postgres
OPENAI_API_KEY=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

FRONTEND_URL=http://localhost:3000
```

---

### 2) Initialize Prisma (database schema on Supabase)

From the **backend** folder:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
Or to push schema without migrations:
```bash
npx prisma db push
```

---

### 3) Start the servers

**Frontend** (http://localhost:3000)
```bash
cd frontend
npm start
```

**Backend** (http://localhost:4000)
```bash
cd backend
npm run dev
```

**Stripe Webhook**
```bash
cd backend
stripe listen --forward-to localhost:4000/api/webhook
```
