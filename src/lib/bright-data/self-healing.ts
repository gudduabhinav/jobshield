import { ScraperRun, HealingEvent, ScraperHealth, ExtractionValidationResult } from '@/types/scraper';
import { JobRecord } from '@/types/jobs';
import { getBrightDataClient } from './client';
import { normalizeRawJobs } from './validator';

interface SelfHealingInput {
  runRecord: ScraperRun;
  validation: ExtractionValidationResult | null;
  failedField: string;
}

interface SelfHealingResult {
  healingEvent: HealingEvent;
  recoveredJobs: JobRecord[] | null;
  healthStatus: ScraperHealth['status'];
}

export async function runSelfHealing(input: SelfHealingInput): Promise<SelfHealingResult> {
  const { runRecord, validation, failedField } = input;
  const healingId = `heal-${Date.now()}`;
  const startedAt = new Date().toISOString();

  const healingEvent: HealingEvent = {
    id: healingId,
    collectorId: runRecord.collectorId,
    failureType: runRecord.errorMessage ? 'api_error' : 'extraction_degradation',
    failedField,
    previousRecordCount: validation?.comparisonWithPrevious?.recordCountChange
      ? runRecord.recordsFound - validation.comparisonWithPrevious.recordCountChange
      : runRecord.recordsFound,
    failedRecordCount: runRecord.recordsFound,
    previousCompleteness: validation ? validation.requiredFieldCompleteness.title : 0.98,
    currentCompleteness: validation ? (validation.anomalies[0]?.currentCompleteness ?? 0) : 0,
    healingStatus: 'healing',
    startedAt,
    completedAt: null,
    recoveredRecordCount: 0,
    recoveryPercentage: 0,
    createdAt: startedAt,
  };

  try {
    console.log(`[SelfHealing] Initiating recovery for collector ${runRecord.collectorId}, failed field: ${failedField}`);

    const client = getBrightDataClient();

    if (client.isConfigured) {
      try {
        const retryResponse = await client.runCollector({
          collector_id: runRecord.collectorId,
          params: { healing_attempt: true, failed_field: failedField },
        });

        const recoveredJobs = normalizeRawJobs(retryResponse.results);
        const recoveredCount = recoveredJobs.filter(j => j.title && j.companyName).length;

        healingEvent.healingStatus = 'recovered';
        healingEvent.completedAt = new Date().toISOString();
        healingEvent.recoveredRecordCount = recoveredCount;
        healingEvent.recoveryPercentage = healingEvent.previousRecordCount > 0
          ? (recoveredCount / healingEvent.previousRecordCount) * 100
          : 0;

        console.log(`[SelfHealing] Recovery successful: ${recoveredCount} records recovered`);
        return {
          healingEvent,
          recoveredJobs,
          healthStatus: 'RECOVERED',
        };
      } catch {
        console.log('[SelfHealing] Retry with Bright Data failed, falling back to cached data');
      }
    }

    healingEvent.healingStatus = 'failed';
    healingEvent.completedAt = new Date().toISOString();
    healingEvent.recoveryPercentage = 0;

    return {
      healingEvent,
      recoveredJobs: null,
      healthStatus: 'FAILED',
    };
  } catch (error) {
    healingEvent.healingStatus = 'failed';
    healingEvent.completedAt = new Date().toISOString();

    console.error('[SelfHealing] Recovery failed:', error);
    return {
      healingEvent,
      recoveredJobs: null,
      healthStatus: 'FAILED',
    };
  }
}

export function createDemoHealingEvent(runRecord: ScraperRun): HealingEvent {
  const now = new Date().toISOString();
  const completedAt = new Date(Date.now() + 60000).toISOString();
  
  return {
    id: `heal-demo-${Date.now()}`,
    collectorId: runRecord.collectorId,
    failureType: 'extraction_degradation',
    failedField: 'title',
    previousRecordCount: 1284,
    failedRecordCount: 0,
    previousCompleteness: 0.98,
    currentCompleteness: 0.04,
    healingStatus: 'recovered',
    startedAt: now,
    completedAt,
    recoveredRecordCount: 1284,
    recoveryPercentage: 100,
    createdAt: now,
  };
}
