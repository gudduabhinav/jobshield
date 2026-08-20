-- JobShield Database Schema
-- This migration creates all necessary tables for the JobShield platform.

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  salary TEXT,
  employment_type TEXT,
  experience_required TEXT,
  posted_date TIMESTAMPTZ,
  application_url TEXT NOT NULL,
  company_url TEXT,
  source_url TEXT,
  source_name TEXT NOT NULL DEFAULT 'unknown',
  skills TEXT[] DEFAULT '{}',
  remote_status TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  risk_reasons JSONB DEFAULT '[]',
  duplicate_group_id TEXT,
  is_reposted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_risk_level ON jobs(risk_level);
CREATE INDEX idx_jobs_risk_score ON jobs(risk_score);
CREATE INDEX idx_jobs_company_name ON jobs(company_name);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_source_name ON jobs(source_name);
CREATE INDEX idx_jobs_duplicate_group_id ON jobs(duplicate_group_id);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH')),
  reasons JSONB DEFAULT '[]',
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_job_id ON risk_assessments(job_id);

-- Scraper runs table
CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
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
CREATE INDEX idx_scraper_runs_status ON scraper_runs(status);
CREATE INDEX idx_scraper_runs_started_at ON scraper_runs(started_at);

-- Scraper health table
CREATE TABLE IF NOT EXISTS scraper_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY', 'DEGRADED', 'FAILED', 'HEALING', 'RECOVERED')),
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
CREATE TABLE IF NOT EXISTS healing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id TEXT NOT NULL,
  failure_type TEXT NOT NULL,
  failed_field TEXT NOT NULL,
  previous_record_count INTEGER DEFAULT 0,
  failed_record_count INTEGER DEFAULT 0,
  previous_completeness DECIMAL(5,4) DEFAULT 0,
  current_completeness DECIMAL(5,4) DEFAULT 0,
  healing_status TEXT NOT NULL DEFAULT 'detected' CHECK (healing_status IN ('detected', 'healing', 'recovered', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recovered_record_count INTEGER DEFAULT 0,
  recovery_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_healing_events_collector_id ON healing_events(collector_id);
CREATE INDEX idx_healing_events_healing_status ON healing_events(healing_status);
CREATE INDEX idx_healing_events_started_at ON healing_events(started_at);
