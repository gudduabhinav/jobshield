import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { annotateDuplicates } from '@/lib/duplicate-detector/similarity';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawData } = body;

    if (!Array.isArray(rawData)) {
      return NextResponse.json({ error: 'rawData must be an array' }, { status: 400 });
    }

    const jobRows = rawData.map((raw: Record<string, unknown>, i: number) => {
      const title = String(raw.title || '');
      const companyName = String(raw.companyName || raw.company_name || '');
      const description = String(raw.description || raw.job_description || '');
      const applicationUrl = String(raw.applicationUrl || raw.application_url || '');

      const assessment = calculateRiskScore({
        title,
        companyName,
        description,
        applicationUrl,
        companyUrl: String(raw.companyUrl || raw.company_url || ''),
        salary: String(raw.salary || ''),
        isReposted: false,
        duplicateGroupId: null,
      });

      return {
        id: `job-import-${Date.now()}-${i}`,
        title,
        company_name: companyName,
        location: String(raw.location || ''),
        description,
        salary: raw.salary ? String(raw.salary) : null,
        employment_type: raw.employmentType ? String(raw.employmentType) : null,
        experience_required: null,
        posted_date: raw.postedDate ? String(raw.postedDate) : null,
        application_url: applicationUrl,
        company_url: raw.companyUrl ? String(raw.companyUrl) : null,
        source_url: raw.sourceUrl ? String(raw.sourceUrl) : null,
        source_name: String(raw.sourceName || raw.source_name || 'import'),
        skills: raw.skills ? String(raw.skills).split(',').map((s: string) => s.trim()) : [],
        remote_status: raw.remoteStatus ? String(raw.remoteStatus) : null,
        scraped_at: new Date().toISOString(),
        risk_score: assessment.score,
        risk_level: assessment.level,
        risk_reasons: assessment.reasons,
        duplicate_group_id: null,
        is_reposted: false,
      };
    });

    const { error } = await db.from('jobs').insert(jobRows);
    if (error) throw error;

    return NextResponse.json({
      imported: jobRows.length,
      jobs: jobRows.slice(0, 10),
      message: `Successfully processed ${jobRows.length} job listings`,
    });
  } catch (error) {
    console.error('[API /jobs/import] Error:', error);
    return NextResponse.json({ error: 'Failed to import jobs' }, { status: 500 });
  }
}
