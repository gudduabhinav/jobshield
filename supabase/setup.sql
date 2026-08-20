-- ============================================================
-- JobShield — Complete Database Setup
-- Run this ONCE in Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/gavfbuveimlcysgkygab/sql/new
-- ============================================================

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS healing_events CASCADE;
DROP TABLE IF EXISTS scraper_health CASCADE;
DROP TABLE IF EXISTS scraper_runs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Jobs table
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  salary TEXT,
  employment_type TEXT,
  experience_required TEXT,
  posted_date TIMESTAMPTZ,
  application_url TEXT NOT NULL DEFAULT '',
  company_url TEXT,
  source_url TEXT,
  source_name TEXT NOT NULL DEFAULT 'unknown',
  skills TEXT[] DEFAULT '{}',
  remote_status TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  risk_reasons JSONB DEFAULT '[]',
  duplicate_group_id TEXT,
  is_reposted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_risk_level ON jobs(risk_level);
CREATE INDEX idx_jobs_risk_score ON jobs(risk_score);
CREATE INDEX idx_jobs_company_name ON jobs(company_name);

-- Scraper runs table
CREATE TABLE scraper_runs (
  id TEXT PRIMARY KEY,
  collector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_found INTEGER DEFAULT 0,
  valid_records INTEGER DEFAULT 0,
  invalid_records INTEGER DEFAULT 0,
  extraction_quality DECIMAL(5,2) DEFAULT 0,
  missing_title_count INTEGER DEFAULT 0,
  missing_company_count INTEGER DEFAULT 0,
  missing_location_count INTEGER DEFAULT 0,
  missing_description_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_runs_collector_id ON scraper_runs(collector_id);

-- Scraper health table
CREATE TABLE scraper_health (
  id TEXT PRIMARY KEY,
  collector_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'HEALTHY',
  last_successful_run TIMESTAMPTZ,
  last_failed_run TIMESTAMPTZ,
  total_records_extracted INTEGER DEFAULT 0,
  extraction_quality DECIMAL(5,2) DEFAULT 0,
  field_completeness JSONB DEFAULT '{}',
  recovery_rate DECIMAL(5,2) DEFAULT 0,
  total_healing_events INTEGER DEFAULT 0,
  average_recovery_time INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Healing events table
CREATE TABLE healing_events (
  id TEXT PRIMARY KEY,
  collector_id TEXT NOT NULL,
  failure_type TEXT NOT NULL,
  failed_field TEXT NOT NULL,
  previous_record_count INTEGER DEFAULT 0,
  failed_record_count INTEGER DEFAULT 0,
  previous_completeness DECIMAL(5,4) DEFAULT 0,
  current_completeness DECIMAL(5,4) DEFAULT 0,
  healing_status TEXT NOT NULL DEFAULT 'detected',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recovered_record_count INTEGER DEFAULT 0,
  recovery_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_healing_events_collector_id ON healing_events(collector_id);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_events ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public read scraper_runs" ON scraper_runs FOR SELECT USING (true);
CREATE POLICY "Public read scraper_health" ON scraper_health FOR SELECT USING (true);
CREATE POLICY "Public read healing_events" ON healing_events FOR SELECT USING (true);

-- Service role insert/update policies
CREATE POLICY "Service insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Service insert scraper_runs" ON scraper_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update scraper_runs" ON scraper_runs FOR UPDATE USING (true);
CREATE POLICY "Service insert scraper_health" ON scraper_health FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update scraper_health" ON scraper_health FOR UPDATE USING (true);
CREATE POLICY "Service insert healing_events" ON healing_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update healing_events" ON healing_events FOR UPDATE USING (true);
