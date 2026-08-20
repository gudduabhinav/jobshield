import { NextResponse } from 'next/server';
import { fetchHighRiskJobs } from '@/lib/db';

export async function GET() {
  try {
    const jobs = await fetchHighRiskJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[API /jobs/high-risk] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch high-risk jobs' }, { status: 500 });
  }
}
