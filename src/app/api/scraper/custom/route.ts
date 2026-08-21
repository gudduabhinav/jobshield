import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper/generic-scraper';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { RiskLevel } from '@/types/jobs';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`[Custom Scrape] Starting scrape of: ${url}`);
    const result = await scrapeUrl(url);
    console.log(`[Custom Scrape] Found ${result.jobs.length} jobs using ${result.method} method`);

    const runId = `custom-${Date.now()}`;
    await db.from('scraper_runs').insert({
      id: runId,
      collector_id: `custom-${new URL(result.url).hostname}`,
      status: 'running',
      started_at: new Date().toISOString(),
      records_found: result.jobs.length,
      valid_records: 0,
      invalid_records: 0,
      extraction_quality: 0,
    });

    let insertedCount = 0;
    let skippedCount = 0;

    for (const job of result.jobs) {
      if (!job.title || job.title.length < 2) {
        skippedCount++;
        continue;
      }

      const risk = calculateRiskScore({
        title: job.title,
        companyName: job.company,
        description: job.description,
        applicationUrl: job.url || result.url,
        companyUrl: null,
        salary: job.salary,
        isReposted: false,
        duplicateGroupId: null,
      });

      const jobId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${insertedCount}`;

      const { error: insertError } = await db.from('jobs').insert({
        id: jobId,
        title: job.title,
        company_name: job.company,
        location: job.location,
        description: job.description.substring(0, 2000),
        application_url: job.url || result.url,
        source_name: new URL(result.url).hostname,
        skills: job.tags.slice(0, 20),
        salary: job.salary,
        posted_date: null,
        scraped_at: new Date().toISOString(),
        risk_score: risk.score,
        risk_level: risk.level as RiskLevel,
        risk_reasons: risk.reasons,
      });

      if (insertError) {
        skippedCount++;
      } else {
        insertedCount++;
      }
    }

    const processingTimeMs = Date.now() - startTime;
    const highRiskCount = result.jobs.filter((_, i) => {
      const risk = calculateRiskScore({
        title: result.jobs[i].title,
        companyName: result.jobs[i].company,
        description: result.jobs[i].description,
        applicationUrl: result.jobs[i].url || result.url,
        companyUrl: null,
        salary: result.jobs[i].salary,
        isReposted: false,
        duplicateGroupId: null,
      });
      return risk.level === 'HIGH';
    }).length;

    await db.from('scraper_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      valid_records: insertedCount,
      invalid_records: skippedCount,
      extraction_quality: result.jobs.length > 0 ? Math.round((insertedCount / result.jobs.length) * 100) : 0,
    }).eq('id', runId);

    console.log(`[Custom Scrape] Complete: ${insertedCount} inserted, ${skippedCount} skipped in ${processingTimeMs}ms`);

    return NextResponse.json({
      message: `Scraped ${result.jobs.length} items from ${result.url}`,
      url: result.url,
      pageTitle: result.title,
      method: result.method,
      stats: {
        totalFound: result.jobs.length,
        inserted: insertedCount,
        skipped: skippedCount,
        highRisk: highRiskCount,
        processingTimeMs,
      },
      sample: result.jobs.slice(0, 5).map(j => ({
        title: j.title,
        company: j.company,
        location: j.location,
      })),
    });
  } catch (error) {
    console.error('[Custom Scrape] Error:', error);
    return NextResponse.json(
      {
        error: 'Scrape failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}