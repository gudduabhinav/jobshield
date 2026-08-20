export interface LiveJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  tags: string[];
  salary_min?: number;
  salary_max?: number;
  date: string;
}

interface RemoteOKJob {
  slug: string;
  id: string;
  company: string;
  position: string;
  description: string;
  location: string;
  apply_url: string;
  url: string;
  tags: string[];
  salary_min: number;
  salary_max: number;
  date: string;
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  description: string;
  candidate_required_location: string;
  url: string;
  tags: string[];
  salary: string;
  publication_date: string;
}

interface ArbeitnowJob {
  id: number;
  title: string;
  company_name: string;
  description: string;
  location: string;
  url: string;
  tags: string[];
  remote: boolean;
  created_at: string;
}

const HTML_TAG_REGEX = /<[^>]*>/g;
const MULTIPLE_SPACES_REGEX = /\s+/g;
const SCRIPT_TAG_REGEX = /<script[^>]*>[\s\S]*?<\/script>/gi;

function stripHtml(html: string): string {
  return html
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(HTML_TAG_REGEX, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(MULTIPLE_SPACES_REGEX, " ")
    .trim();
}

function cleanDescription(desc: string): string {
  const cleaned = stripHtml(desc);
  return cleaned.length > 2000 ? cleaned.substring(0, 2000) + "..." : cleaned;
}

export async function fetchRemoteOK(limit: number = 100): Promise<LiveJob[]> {
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobShield/1.0" },
    });
    if (!response.ok) throw new Error(`RemoteOK API error: ${response.status}`);
    const data: RemoteOKJob[] = await response.json();
    return data
      .filter((job) => job.position && job.company)
      .slice(0, limit)
      .map((job) => ({
        title: job.position,
        company: job.company,
        location: job.location || "Remote",
        description: cleanDescription(job.description || ""),
        url: job.url || job.apply_url || `https://remoteok.com/remote-jobs/${job.slug}`,
        source: "remoteok",
        tags: job.tags || [],
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        date: job.date || new Date().toISOString(),
      }));
  } catch (error) {
    console.error("RemoteOK fetch failed:", error);
    return [];
  }
}

export async function fetchRemotive(limit: number = 50): Promise<LiveJob[]> {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?limit=${limit}`, {
      headers: { "User-Agent": "JobShield/1.0" },
    });
    if (!response.ok) throw new Error(`Remotive API error: ${response.status}`);
    const data = await response.json();
    const jobs: RemotiveJob[] = data.jobs || [];
    return jobs.map((job) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      description: cleanDescription(job.description || ""),
      url: job.url || `https://remotive.com/remote-jobs/${job.id}`,
      source: "remotive",
      tags: job.tags || [],
      date: job.publication_date || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Remotive fetch failed:", error);
    return [];
  }
}

export async function fetchArbeitnow(limit: number = 100): Promise<LiveJob[]> {
  try {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "JobShield/1.0" },
    });
    if (!response.ok) throw new Error(`Arbeitnow API error: ${response.status}`);
    const data = await response.json();
    const jobs: ArbeitnowJob[] = data.data || [];
    return jobs
      .filter((job) => job.title && job.company_name)
      .slice(0, limit)
      .map((job) => ({
        title: job.title,
        company: job.company_name,
        location: job.location || (job.remote ? "Remote" : "Not specified"),
        description: cleanDescription(job.description || ""),
        url: job.url || `https://www.arbeitnow.com/job/${job.id}`,
        source: "arbeitnow",
        tags: job.tags || [],
        date: job.created_at || new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Arbeitnow fetch failed:", error);
    return [];
  }
}

export interface ScrapeResult {
  jobs: LiveJob[];
  stats: {
    totalFetched: number;
    bySource: Record<string, number>;
    fetchTime: string;
  };
}

export async function fetchAllSources(): Promise<ScrapeResult> {
  const startTime = Date.now();

  const [remoteokJobs, remotiveJobs, arbeitnowJobs] = await Promise.all([
    fetchRemoteOK(100),
    fetchRemotive(50),
    fetchArbeitnow(100),
  ]);

  const allJobs = [...remoteokJobs, ...remotiveJobs, ...arbeitnowJobs];

  return {
    jobs: allJobs,
    stats: {
      totalFetched: allJobs.length,
      bySource: {
        remoteok: remoteokJobs.length,
        remotive: remotiveJobs.length,
        arbeitnow: arbeitnowJobs.length,
      },
      fetchTime: new Date(Date.now() - startTime).toISOString(),
    },
  };
}