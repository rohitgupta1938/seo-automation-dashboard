# SEO Automation Dashboard — Edgelink Technology

## Project Overview

A full-stack AI-powered SEO Automation SaaS platform that automates website SEO auditing with:
- Automated website crawling (Fetch + Cheerio)
- Technical SEO & On-Page analysis
- Google PageSpeed Insights (mocked)
- Google Search Console integration (mocked)
- DataForSEO keyword rankings (mocked)
- Schema.org validation
- AI-powered SEO analysis (Anthropic Claude claude-sonnet-4-6)
- Background processing (BullMQ + Upstash Redis)
- PostgreSQL database (Prisma ORM)
- Automated PDF report generation (Puppeteer)
- WhatsApp & Email report delivery (mocked)
- Real-time audit progress tracking
- Admin and Client portals (Next.js 14)

---

## Architecture

```
Browser → Next.js 14 Frontend (Vercel)
              ↓
        Express.js API (Port 4000)
              ↓
        BullMQ Queue (Upstash Redis)
              ↓
        BullMQ Worker (Node.js VPS)
              ↓ (sequential pipeline)
        1. Fetch + Cheerio Crawler
        2. PageSpeed Mock
        3. GSC Mock
        4. Schema Validator
        5. On-Page Analyzer
        6. Technical SEO Analyzer
        7. DataForSEO Mock
        8. Claude AI Analysis
        9. PostgreSQL (Prisma)
        10. Puppeteer PDF
        11. WhatsApp Mock / Email
        12. Notifications
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, App Router, JavaScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Queue | BullMQ, Upstash Redis |
| Database | PostgreSQL, Prisma ORM (Supabase/Neon) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| PDF | Puppeteer |
| Crawler | Fetch API + Cheerio |

---

## Prerequisites

- Node.js 18+ (tested on 24.x)
- npm 9+
- PostgreSQL database (Supabase or Neon recommended)
- Upstash Redis account
- Anthropic API key (or set USE_MOCKS=true)

---

## Installation

### 1. Clone the repository

```powershell
git clone <repo-url>
cd seo-automation-dashboard
```

### 2. Backend Setup

```powershell
cd backend
copy .env.example .env
# Edit .env with your credentials
npm install
```

### 3. Frontend Setup

```powershell
cd ../frontend
copy .env.local.example .env.local
# Edit .env.local
npm install
```

---

## Environment Configuration

### Backend `.env`

```env
NODE_ENV=development
USE_MOCKS=true

DATABASE_URL=postgresql://user:pass@host:5432/seo_dashboard?sslmode=require
DIRECT_URL=postgresql://user:pass@host:5432/seo_dashboard?sslmode=require

UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-token

ANTHROPIC_API_KEY=sk-ant-...

JWT_SECRET=your-secret-min-32-chars

NEXT_PUBLIC_API_URL=http://localhost:3000
CRON_SECRET=your-cron-secret
REPORTS_DIR=./reports

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your-app-password
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Database Setup

```powershell
cd backend
npx prisma generate
npx prisma db push
node src/utils/seed.js
```

---

## Running the Application

### Start the Backend API Server

```powershell
cd backend
npm run dev
# Starts on http://localhost:4000
```

### Start the BullMQ Worker (separate terminal)

```powershell
cd backend
npm run worker:dev
# Persistent worker process — do NOT run on Vercel
```

### Start the Frontend

```powershell
cd frontend
npm run dev
# Opens http://localhost:3000
```

---

## Demo Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@seodashboard.com` | `Admin@1234` |
| Client | `demo@dentalclinic.com` | `Client@1234` |

---

## Triggering an Audit

### Via Admin Portal
1. Login as Admin → go to **Audits** → click **Start Audit**
2. Select a website → click **Create Audit**
3. Monitor progress in real-time (polls every 5 seconds)

### Via API (curl)
```powershell
# Login
$token = (Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@seodashboard.com","password":"Admin@1234"}').token

# Create Audit
Invoke-RestMethod -Uri "http://localhost:4000/api/audits" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"websiteId":"demo-website-001"}'
```

---

## Mock Mode

**`USE_MOCKS=true`** (default):
- PageSpeed returns exact mock data (performance: 61%, LCP: 4.2s, etc.)
- Google Search Console returns dental clinic mock queries
- DataForSEO returns "dental clinic pune" ranking mock
- WhatsApp delivery is logged to console
- Claude uses mock analysis if no ANTHROPIC_API_KEY

**`USE_MOCKS=false`**:
- Real API credentials required for PageSpeed, GSC, DataForSEO
- Real Anthropic API key required for Claude

---

## Real Claude Integration

Set `ANTHROPIC_API_KEY=sk-ant-...` in backend `.env`.

The system auto-detects and uses real Claude when the key is present, regardless of USE_MOCKS. Model used: `claude-sonnet-4-6`.

---

## PDF Report Generation

Reports are generated by Puppeteer after each completed audit.

```powershell
# Reports directory
ls backend/reports/
```

Reports are served at: `http://localhost:4000/reports/<filename>.pdf`

Download via API: `GET /api/reports/:id/download` (requires auth token)

---

## Monthly Scheduled Audits

Configure cron-job.org to call:
```
POST https://your-api.com/api/cron/monthly-audits
Header: x-cron-secret: your-cron-secret
```

Or test locally:
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/cron/monthly-audits" `
  -Method POST -Headers @{"x-cron-secret"="your-cron-secret"}
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | — | Login |
| POST | /api/auth/register | — | Register |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/clients | Admin | List clients |
| POST | /api/clients | Admin | Create client |
| PATCH | /api/clients/:id | Admin | Update client |
| DELETE | /api/clients/:id | Admin | Delete client |
| GET | /api/websites | JWT | List websites |
| POST | /api/websites | JWT | Create website |
| PATCH | /api/websites/:id | JWT | Update website |
| DELETE | /api/websites/:id | JWT | Delete website |
| POST | /api/audits | JWT | Start audit |
| GET | /api/audits | JWT | List audits |
| GET | /api/audits/:id/status | JWT | Audit progress |
| POST | /api/audits/:id/retry | Admin | Retry failed audit |
| GET | /api/reports | JWT | List reports |
| GET | /api/reports/:id/download | JWT | Download PDF |
| GET | /api/notifications | JWT | Notifications |
| POST | /api/cron/monthly-audits | Cron Secret | Trigger monthly audits |
| GET | /api/health | — | Health check |

---

## Deployment

### Frontend (Vercel)
```
vercel deploy --prod
```
Set env var: `NEXT_PUBLIC_API_URL=https://your-api.railway.app`

### Backend (Railway / Render / VPS)
```
cd backend && npm start
```

### Worker (VPS — REQUIRED, not Vercel)
```
cd backend && node worker.js
```
> ⚠️ The BullMQ worker must run as a persistent Node.js process. It cannot run on Vercel serverless.

### Database
Use Supabase or Neon PostgreSQL. Run `npx prisma db push` after deploy.

### Redis
Use Upstash Redis. Free tier sufficient for development.

---

## Known Limitations

1. **Worker deployment**: Must run on a persistent VPS; Vercel serverless is not compatible
2. **Puppeteer on serverless**: PDF generation uses Puppeteer which requires a full browser — deploy on VPS alongside worker
3. **Real GSC integration**: Requires OAuth2 setup with Google Cloud Console
4. **Real DataForSEO**: Requires paid DataForSEO API subscription
5. **Email delivery**: Requires SMTP credentials; dev mode simulates delivery
6. **Crawl limits**: Crawler respects robots.txt and limits to 5 pages max per audit

---

## Project Structure

```
seo-automation-dashboard/
├── frontend/                 # Next.js 14 App
│   ├── app/
│   │   ├── login/
│   │   ├── admin/           # Admin portal
│   │   └── client/          # Client portal
│   ├── components/
│   │   ├── layout/          # Sidebars, headers
│   │   ├── shared/          # StatCard, SEOScoreCard, etc.
│   │   └── charts/          # Recharts components
│   ├── contexts/            # AuthContext
│   └── lib/                 # api.js, utils.js
│
└── backend/
    ├── server.js            # Express API server
    ├── worker.js            # BullMQ worker (standalone)
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── ai/              # Claude integration
        ├── config/          # DB, Redis, Logger
        ├── controllers/     # Auth, Clients, Websites, Audits
        ├── crawlers/        # Fetch + Cheerio crawler
        ├── middleware/      # Auth, Error handling
        ├── mocks/           # PageSpeed, GSC, DataForSEO, Twilio
        ├── notifications/   # Email, WhatsApp, Notification service
        ├── queues/          # BullMQ queue
        ├── reports/         # Puppeteer PDF generator
        ├── routes/          # API routes
        └── services/        # PageSpeed, GSC, DataForSEO, Schema, OnPage, Technical analyzers
```
