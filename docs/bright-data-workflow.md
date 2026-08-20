# Bright Data Workflow

This document explains how Bright Data Scraper Studio is integrated into JobShield.

## Overview

Bright Data Scraper Studio is the **central data source** for JobShield. All job listings in the platform come from Bright Data collectors.

## Scraper Configuration

### Collector Setup

The Bright Data collector is configured to scrape publicly available job listings from job boards.

**Requested Fields:**
- `title` — Job title
- `company_name` — Company name
- `location` — Job location
- `job_description` — Full job description
- `posted_date` — When the job was posted
- `application_url` — Link to apply
- `salary` — Salary range (when available)
- `employment_type` — Full-time, Part-time, Contract
- `skills` — Required skills

### Structured Output

Bright Data returns structured JSON:

```json
{
  "title": "Senior Software Engineer",
  "company_name": "Google",
  "location": "Mountain View, CA",
  "job_description": "We are looking for...",
  "posted_date": "2026-08-15",
  "application_url": "https://careers.google.com/..."
}
```

## Integration Architecture

All Bright Data calls are isolated in `src/lib/bright-data/`:

```
lib/bright-data/
  client.ts       — API client for Bright Data
  collector.ts    — Orchestrates collector runs
  types.ts        — Bright Data request/response types
  validator.ts    — Normalizes raw output to JobRecord
  health.ts       — Validates extraction quality
  self-healing.ts — Handles recovery workflow
```

## How Extraction Quality is Validated

For every collector run:

1. **Count records** — Are there results?
2. **Check required fields** — Is title, company, location present?
3. **Compare against previous** — Did quality drop?
4. **Detect anomalies** — Any field below threshold?

Thresholds:
- Title completeness: must be ≥ 85%
- Company completeness: must be ≥ 80%
- Location completeness: must be ≥ 75%
- Record count: must not drop > 50%

## How Self-Healing Works

When extraction fails:

1. **Detection**: Validation layer flags anomalies
2. **Classification**: Failure type determined (schema change, CSS break, etc.)
3. **Healing**: Bright Data re-analyzes page structure
4. **Recovery**: New extraction logic applied
5. **Validation**: Output re-checked
6. **Recording**: Healing event persisted with before/after metrics

## Coding Agent Workflow

This integration was developed using AI coding assistance:

```
Create a Bright Data scraper for publicly available job listings.
Validate the collector output against the JobListing schema.
Detect extraction degradation.
Trigger the self-healing workflow when required fields disappear.
```

The developer reviewed and verified all generated code.
