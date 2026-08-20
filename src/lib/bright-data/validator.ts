import { RawJobData, JobRecord, RiskLevel, RiskReason } from '@/types/jobs';

export function normalizeRawJob(raw: RawJobData, index: number): JobRecord {
  const id = `job-${Date.now()}-${index}`;
  const now = new Date().toISOString();
  
  const skills = raw.skills 
    ? raw.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    id,
    title: raw.title || '',
    companyName: raw.company_name || '',
    location: raw.location || '',
    description: raw.job_description || '',
    salary: raw.salary || null,
    employmentType: raw.employment_type || null,
    experienceRequired: raw.experience_required || null,
    postedDate: raw.posted_date || null,
    applicationUrl: raw.application_url || '',
    companyUrl: raw.company_url || null,
    sourceUrl: raw.source_url || null,
    sourceName: raw.source_name || 'unknown',
    skills,
    remoteStatus: raw.remote_status || null,
    scrapedAt: now,
    riskScore: 0,
    riskLevel: 'LOW' as RiskLevel,
    riskReasons: [] as RiskReason[],
    duplicateGroupId: null,
    isReposted: false,
  };
}

export function normalizeRawJobs(rawData: Record<string, unknown>[]): JobRecord[] {
  return rawData.map((raw, index) => {
    const jobData: RawJobData = {
      title: String(raw.title || ''),
      company_name: String(raw.company_name || raw.company || ''),
      location: String(raw.location || ''),
      job_description: String(raw.job_description || raw.description || ''),
      posted_date: String(raw.posted_date || raw.date_posted || ''),
      application_url: String(raw.application_url || raw.apply_url || raw.url || ''),
      salary: raw.salary ? String(raw.salary) : undefined,
      employment_type: raw.employment_type ? String(raw.employment_type) : undefined,
      experience_required: raw.experience_required ? String(raw.experience_required) : undefined,
      company_url: raw.company_url ? String(raw.company_url) : undefined,
      source_url: raw.source_url ? String(raw.source_url) : undefined,
      category: raw.category ? String(raw.category) : undefined,
      skills: raw.skills ? String(raw.skills) : undefined,
      remote_status: raw.remote_status ? String(raw.remote_status) : undefined,
      company_description: raw.company_description ? String(raw.company_description) : undefined,
      contact_email: raw.contact_email ? String(raw.contact_email) : undefined,
      source_name: raw.source_name ? String(raw.source_name) : undefined,
    };
    return normalizeRawJob(jobData, index);
  });
}
