import { NextResponse } from 'next/server';
import { getDemoJobs } from '@/lib/demo-data';
import { RiskLevel } from '@/types/jobs';

interface CompanyData {
  name: string;
  jobCount: number;
  avgRisk: number;
  locations: string[];
  riskLevel: RiskLevel;
}

export async function GET() {
  try {
    const jobs = getDemoJobs();
    const companyMap = new Map<string, { name: string; jobCount: number; risks: number[]; locations: Set<string> }>();

    for (const job of jobs) {
      const name = job.companyName || 'Unknown Company';
      const existing = companyMap.get(name) || { name, jobCount: 0, risks: [], locations: new Set() };
      existing.jobCount++;
      existing.locations.add(job.location);
      existing.risks.push(job.riskScore);
      companyMap.set(name, existing);
    }

    const companies: CompanyData[] = Array.from(companyMap.values()).map(c => {
      const avg = c.risks.reduce((a, b) => a + b, 0) / c.risks.length;
      let riskLevel: RiskLevel = 'LOW';
      if (avg > 60) riskLevel = 'HIGH';
      else if (avg > 30) riskLevel = 'MEDIUM';

      return {
        name: c.name,
        jobCount: c.jobCount,
        avgRisk: Math.round(avg),
        locations: Array.from(c.locations),
        riskLevel,
      };
    });

    companies.sort((a, b) => b.jobCount - a.jobCount);

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('[API /companies] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
