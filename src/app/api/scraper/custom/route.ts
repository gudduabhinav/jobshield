import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapeWithSelfHealing } from '@/lib/scraper/self-healing-scraper';
import { calculateRiskScore } from '@/lib/risk-engine/scoring';
import { RiskLevel } from '@/types/jobs';

interface ScrapeItem {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary: string | null;
  tags: string[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = 'unknown';
    }

    console.log(`[Self-Heal] Starting: ${url}`);

    const scrapeResult = await scrapeWithSelfHealing(url) as Awaited<ReturnType<typeof scrapeWithSelfHealing>> & { items?: ScrapeItem[] };
    const items = scrapeResult.items ?? [];

    console.log(`[Self-Heal] ${items.length} items via ${scrapeResult.finalMethod} (healed: ${scrapeResult.healingEvents.length} events)`);

    // Log scraper run
    const runId = `selfheal-${Date.now()}`;
    await db.from('scraper_runs').insert({
      id: runId,
      collector_id: `custom-${hostname}`,
      status: scrapeResult.succeeded ? 'completed' : 'failed',
      started_at: scrapeResult.scrapedAt,
      completed_at: new Date().toISOString(),
      records_found: items.length,
      valid_records: 0,
      invalid_records: 0,
      extraction_quality: 0,
    });

    if (!scrapeResult.succeeded) {
      const processingTimeMs = Date.now() - startTime;
      return NextResponse.json({
        message: `Failed to scrape ${url} — all strategies exhausted`,
        url,
        pageTitle: scrapeResult.pageTitle,
        method: scrapeResult.finalMethod,
        succeeded: false,
        stats: {
          totalFound: 0,
          inserted: 0,
          skipped: 0,
          highRisk: 0,
          healingEvents: scrapeResult.healingEvents.length,
          strategiesAttempted: scrapeResult.attempts.length,
          processingTimeMs,
        },
        attempts: scrapeResult.attempts.map(a => ({
          method: a.method,
          strategy: a.strategy,
          success: a.success,
          error: a.error,
          durationMs: a.durationMs,
        })),
        healingEvents: scrapeResult.healingEvents,
      }, { status: 200 });
    }

    // Score + insert each item
    let insertedCount = 0;
    let skippedCount = 0;
    let highRiskCount = 0;

    for (const item of items) {
      if (!item.title || item.title.length < 2) {
        skippedCount++;
        continue;
      }

      const risk = calculateRiskScore({
        title: item.title,
        companyName: item.company,
        description: item.description,
        applicationUrl: item.url || url,
        companyUrl: null,
        salary: item.salary,
        isReposted: false,
        duplicateGroupId: null,
      });

      if (risk.level === 'HIGH') highRiskCount++;

      const jobId = `selfheal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${insertedCount}`;

      const { error: insertError } = await db.from('jobs').insert({
        id: jobId,
        title: item.title,
        company_name: item.company,
        location: item.location,
        description: item.description.substring(0, 2000),
        application_url: item.url || url,
        source_name: hostname,
        skills: item.tags.slice(0, 20),
        salary: item.salary,
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

    // Update scraper run
    await db.from('scraper_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      valid_records: insertedCount,
      invalid_records: skippedCount,
      extraction_quality: items.length > 0 ? Math.round((insertedCount / items.length) * 100) : 0,
    }).eq('id', runId);

    // Update scraper health
    const existingHealth = await db.from('scraper_health')
      .select('id, total_runs, successful_runs, failed_runs, last_run_at')
      .eq('collector_id', `custom-${hostname}`)
      .single();

    if (existingHealth.data) {
      const h = existingHealth.data;
      const newTotal = (h.total_runs || 0) + 1;
      const newSuccessful = (h.successful_runs || 0) + 1;
      const healthScore = Math.round((newSuccessful / newTotal) * 100);

      await db.from('scraper_health').update({
        total_runs: newTotal,
        successful_runs: newSuccessful,
        failed_runs: h.failed_runs || 0,
        health_score: healthScore,
        last_run_at: new Date().toISOString(),
        last_status: 'healthy',
        next_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        field_completeness: {
          applicationUrl: { completeness: 100, isTracked: true },
          title: { completeness: 100, isTracked: true },
          company: { completeness: 100, isTracked: true },
        },
      }).eq('collector_id', `custom-${hostname}`);
    } else {
      await db.from('scraper_health').insert({
        id: `health-${hostname}-${Date.now()}`,
        collector_id: `custom-${hostname}`,
        collector_type: 'custom',
        health_score: 100,
        status: 'healthy',
        last_run_at: new Date().toISOString(),
        last_status: 'healthy',
        total_runs: 1,
        successful_runs: 1,
        failed_runs: 0,
        next_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        field_completeness: {
          applicationUrl: { completeness: 100, isTracked: true },
          title: { completeness: 100, isTracked: true },
          company: { completeness: 100, isTracked: true },
        },
      });
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(`[Self-Heal] Done: ${insertedCount} inserted, ${skippedCount} skipped, ${processingTimeMs}ms`);

    return NextResponse.json({
      message: `Scraped ${items.length} items from ${url}`,
      url,
      pageTitle: scrapeResult.pageTitle,
      method: scrapeResult.finalMethod,
      succeeded: true,
      stats: {
        totalFound: items.length,
        inserted: insertedCount,
        skipped: skippedCount,
        highRisk: highRiskCount,
        healingEvents: scrapeResult.healingEvents.length,
        strategiesAttempted: scrapeResult.attempts.length,
        processingTimeMs,
      },
      attempts: scrapeResult.attempts.map(a => ({
        method: a.method,
        strategy: a.strategy,
        success: a.success,
        error: a.error,
        durationMs: a.durationMs,
      })),
      healingEvents: scrapeResult.healingEvents,
      sample: items.slice(0, 5).map(j => ({
        title: j.title,
        company: j.company,
        location: j.location,
      })),
    });
  } catch (error) {
    console.error('[Self-Heal] Error:', error);
    return NextResponse.json(
      {
        error: 'Scrape failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
