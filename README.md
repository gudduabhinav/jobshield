# JobShield

**Self-Healing Job Scam Detection & Intelligence Platform**

> A hackathon project for [WeMakeDevs "Into the Scrape-Verse"](https://wemakedevs.org) — powered by [Bright Data Scraper Studio](https://brightdata.com).

---

## The Problem

Job seekers encounter thousands of suspicious and stale job postings every day. Fake job scams waste people's time, steal personal information, and sometimes cost money. Meanwhile, legitimate job listings get reposted repeatedly, making it hard to know what's fresh and what's old.

Traditional web scraping breaks when websites change their layout. When that happens, data pipelines go dark, and the product stops working.

## The Solution

**JobShield** is a job intelligence and scam-risk detection platform that:

1. **Collects** publicly available job listings using Bright Data Scraper Studio
2. **Validates** extraction quality in real-time
3. **Self-heals** when the target website changes its HTML structure
4. **Scores** each job posting for scam risk using deterministic rules
5. **Detects** duplicate and reposted listings across sources
6. **Presents** everything through a polished cybersecurity-themed dashboard

## Architecture

```
Public Job Website
        |
        v
Bright Data Scraper Studio
        |
        v
  Bright Data Collector
        |
        v
   Structured JSON
        |
        v
Next.js Server/API Layer
        |
   +----+----+
   |         |
   v         v
Risk       Duplicate/
Engine     Repost Detector
   |         |
   +----+----+
        |
        v
    Supabase
    (PostgreSQL)
        |
        v
Next.js Dashboard
        |
        v
      Vercel
```

### Scraper Health Pipeline

```
Collector
    |
    v
Extraction Validation
    |
    +---- Healthy ----> Continue
    |
    +---- Failed -----> Detect failure
                          |
                          v
                     Self-Healing
                          |
                          v
                 Re-run collector
                          |
                          v
                     Validate output
                          |
                          v
                    Recovery event
                          |
                          v
                    Continue pipeline
```

## Why Bright Data?

Bright Data Scraper Studio is central to this product — not optional, not bolted on.

- **Data Source**: All job data in JobShield comes from Bright Data collectors
- **Structured Output**: Bright Data returns structured JSON that feeds directly into our risk engine
- **Self-Healing**: When target websites change their HTML, Bright Data's self-healing capability detects the failure and adapts the extraction logic
- **Reliability**: The platform monitors extraction quality and triggers recovery when field completeness drops below thresholds

The entire data pipeline depends on Bright Data. Without it, there is no data.

## Self-Healing Workflow

This is the core innovation of JobShield:

1. **Extraction runs** via Bright Data collector
2. **Validation layer** checks output quality — field completeness, record counts, anomalies
3. **Failure detected** when title completeness drops from 98% to 4%, or record count hits 0
4. **Self-healing triggered** — Bright Data Scraper Studio re-analyzes the source page
5. **Extraction repaired** — new selectors applied, output validated
6. **Recovery event recorded** — timestamp, field, before/after stats
7. **Data pipeline continues** — structured jobs flow into risk engine

All healing events are persisted and visible in the dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Next.js Route Handlers, Server Actions |
| Database | Supabase (PostgreSQL) |
| Scraping | Bright Data Scraper Studio |
| Deployment | Vercel |
| Icons | Lucide React |

## Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/jobshield.git
cd jobshield

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your credentials in .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Environment Variables

See `.env.example` for the required variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Bright Data
BRIGHT_DATA_API_KEY=your-bright-data-api-key
BRIGHT_DATA_COLLECTOR_ID=your-collector-id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Never commit `.env.local` or expose API keys in the browser.

## Database Setup

1. Create a Supabase project
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Configure Row Level Security policies

## Bright Data Setup

1. Create a Bright Data account
2. Set up a Scraper Studio collector for job listings
3. Configure the collector to extract: title, company, location, description, application URL
4. Set the collector ID in `BRIGHT_DATA_COLLECTOR_ID`
5. Set your API key in `BRIGHT_DATA_API_KEY`

See `docs/bright-data-workflow.md` for detailed setup instructions.

## Demo

Visit `/demo` to see a self-contained demonstration of the self-healing workflow:

1. Start with a healthy scraper (1,284 records, 97.8% quality)
2. Simulate a source website layout change
3. Watch the extraction fail (0 records)
4. See self-healing initiate
5. Watch recovery (1,284 records recovered)

> The demo page clearly distinguishes simulated events from real Bright Data self-healing events.

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Responsible Scraping

JobShield only uses **publicly accessible** job listing data. We do NOT scrape:

- Private profiles
- Login-protected pages
- Paywalled content
- Personal or private information

All data comes from publicly available job boards and career pages.

## Disclaimer

JobShield provides automated risk signals for informational purposes only. Risk scores are generated by an algorithm and are **not a definitive determination of fraud or illegality**. Always verify job opportunities through official company channels.

---

*Built for WeMakeDevs "Into the Scrape-Verse" Hackathon*
