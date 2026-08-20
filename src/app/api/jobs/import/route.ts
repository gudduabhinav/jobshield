import { NextResponse } from 'next/server';
import { normalizeRawJobs } from '@/lib/bright-data/validator';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { annotateDuplicates } from '@/lib/duplicate-detector/similarity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawData } = body;

    if (!Array.isArray(rawData)) {
      return NextResponse.json({ error: 'rawData must be an array' }, { status: 400 });
    }

    let jobs = normalizeRawJobs(rawData);

    jobs = jobs.map(job => {
      const assessment = calculateRiskScore({
        title: job.title,
        companyName: job.companyName,
        description: job.description,
        applicationUrl: job.applicationUrl,
        companyUrl: job.companyUrl,
        salary: job.salary,
        isReposted: job.isReposted,
        duplicateGroupId: job.duplicateGroupId,
      });
      return {
        ...job,
        riskScore: assessment.score,
        riskLevel: assessment.level,
        riskReasons: assessment.reasons,
      };
    });

    jobs = annotateDuplicates(jobs);

    return NextResponse.json({
      imported: jobs.length,
      jobs: jobs.slice(0, 10),
      message: `Successfully processed ${jobs.length} job listings`,
    });
  } catch (error) {
    console.error('[API /jobs/import] Error:', error);
    return NextResponse.json({ error: 'Failed to import jobs' }, { status: 500 });
  }
}
