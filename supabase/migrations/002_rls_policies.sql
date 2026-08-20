-- Row Level Security Policies for JobShield
-- Enable RLS on all tables

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_events ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (this is public job data)
CREATE POLICY "Public read access for companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read access for jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Public read access for risk_assessments" ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Public read access for scraper_runs" ON scraper_runs FOR SELECT USING (true);
CREATE POLICY "Public read access for scraper_health" ON scraper_health FOR SELECT USING (true);
CREATE POLICY "Public read access for healing_events" ON healing_events FOR SELECT USING (true);

-- Service role full access for inserts/updates
CREATE POLICY "Service role insert companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update companies" ON companies FOR UPDATE USING (true);
CREATE POLICY "Service role insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Service role insert risk_assessments" ON risk_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert scraper_runs" ON scraper_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update scraper_runs" ON scraper_runs FOR UPDATE USING (true);
CREATE POLICY "Service role insert scraper_health" ON scraper_health FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update scraper_health" ON scraper_health FOR UPDATE USING (true);
CREATE POLICY "Service role insert healing_events" ON healing_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role update healing_events" ON healing_events FOR UPDATE USING (true);
