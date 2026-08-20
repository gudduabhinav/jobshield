import { NextResponse } from 'next/server';
import { getDemoJobs } from '@/lib/demo-data';

export async function GET() {
  try {
    const jobs = getDemoJobs();
    const highRisk = jobs.filter(j => j.riskLevel === 'HIGH');
    return NextResponse.json({ jobs: highRisk });
  } catch (error) {
    console.error('[API /jobs/high-risk] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch high-risk jobs' }, { status: 500 });
  }
}
