import { getBrightDataClient } from './client';
import { normalizeRawJobs } from './validator';
import { validateExtraction } from './health';
import { runSelfHealing } from './self-healing';
import { ScraperRun, ScraperHealth } from '@/types/scraper';
import { JobRecord } from '@/types/jobs';

export async function runCollector(): Promise<{
  run: ScraperRun;
  jobs: JobRecord[];
  healthUpdate: Partial<ScraperHealth>;
}> {
  const client = getBrightDataClient();
  const runId = `run-${Date.now()}`;
  const startTime = new Date().toISOString();

  const runRecord: ScraperRun = {
    id: runId,
    collectorId: process.env.BRIGHT_DATA_COLLECTOR_ID || 'default-collector',
    status: 'running',
    startedAt: startTime,
    completedAt: null,
    recordsFound: 0,
    validRecords: 0,
    invalidRecords: 0,
    extractionQuality: 0,
    missingTitleCount: 0,
    missingCompanyCount: 0,
    missingLocationCount: 0,
    missingDescriptionCount: 0,
    errorMessage: null,
    createdAt: startTime,
  };

  try {
    const response = await client.runCollector();
    const rawData = response.results;

    runRecord.recordsFound = rawData.length;
    runRecord.status = 'completed';
    runRecord.completedAt = new Date().toISOString();

    const normalizedJobs = normalizeRawJobs(rawData);

    const validation = validateExtraction(normalizedJobs, rawData);

    runRecord.validRecords = validation.isHealthy ? normalizedJobs.length : normalizedJobs.filter(j => j.title && j.companyName).length;
    runRecord.invalidRecords = runRecord.recordsFound - runRecord.validRecords;
    runRecord.extractionQuality = validation.requiredFieldCompleteness.title * 100;
    runRecord.missingTitleCount = Math.round((1 - validation.requiredFieldCompleteness.title) * normalizedJobs.length);
    runRecord.missingCompanyCount = Math.round((1 - validation.requiredFieldCompleteness.company) * normalizedJobs.length);
    runRecord.missingLocationCount = Math.round((1 - validation.requiredFieldCompleteness.location) * normalizedJobs.length);
    runRecord.missingDescriptionCount = Math.round((1 - validation.requiredFieldCompleteness.description) * normalizedJobs.length);

    if (!validation.isHealthy && validation.anomalies.length > 0) {
      const failedField = validation.anomalies.find(a => a.severity === 'high')?.field || 'unknown';
      await runSelfHealing({
        runRecord,
        validation,
        failedField,
      });
    }

    return {
      run: runRecord,
      jobs: normalizedJobs,
      healthUpdate: {
        status: validation.isHealthy ? 'HEALTHY' : 'DEGRADED',
        lastSuccessfulRun: validation.isHealthy ? new Date().toISOString() : null,
        extractionQuality: runRecord.extractionQuality,
        totalRecordsExtracted: normalizedJobs.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    runRecord.status = 'failed';
    runRecord.completedAt = new Date().toISOString();
    runRecord.errorMessage = message;

    const healingResult = await runSelfHealing({
      runRecord,
      validation: null,
      failedField: 'all',
    });

    return {
      run: runRecord,
      jobs: healingResult?.recoveredJobs || [],
      healthUpdate: {
        status: healingResult ? 'HEALING' : 'FAILED',
        lastFailedRun: new Date().toISOString(),
      },
    };
  }
}
