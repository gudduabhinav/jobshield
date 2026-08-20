export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ScraperStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'HEALING' | 'RECOVERED' | 'IDLE';
export type HealingStatus = 'detected' | 'healing' | 'recovered' | 'failed';
export type ScraperRunStatus = 'running' | 'completed' | 'failed';

export interface RawJobData {
  title: string;
  company_name: string;
  location: string;
  job_description: string;
  posted_date: string;
  application_url: string;
  salary?: string;
  employment_type?: string;
  experience_required?: string;
  company_url?: string;
  source_url?: string;
  category?: string;
  skills?: string;
  remote_status?: string;
  company_description?: string;
  contact_email?: string;
  source_name?: string;
}

export interface RiskReason {
  ruleId: string;
  name: string;
  weight: number;
  description: string;
}

export interface JobRecord {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  salary: string | null;
  employmentType: string | null;
  experienceRequired: string | null;
  postedDate: string | null;
  applicationUrl: string;
  companyUrl: string | null;
  sourceUrl: string | null;
  sourceName: string;
  skills: string[];
  remoteStatus: string | null;
  scrapedAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: RiskReason[];
  duplicateGroupId: string | null;
  isReposted: boolean;
}
