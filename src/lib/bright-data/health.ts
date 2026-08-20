import { ExtractionValidationResult, ExtractionAnomaly, FieldCompleteness, ScraperHealth } from '@/types/scraper';
import { JobRecord } from '@/types/jobs';

const HEALTH_THRESHOLDS = {
  titleCompleteness: 0.85,
  companyCompleteness: 0.80,
  locationCompleteness: 0.75,
  descriptionCompleteness: 0.70,
  minRecordCount: 1,
  maxRecordDropPercent: 0.50,
};

export function validateExtraction(
  jobs: JobRecord[],
  rawData: Record<string, unknown>[],
  previousHealth?: Partial<ScraperHealth>
): ExtractionValidationResult {
  const total = Math.max(jobs.length, 1);
  const recordCount = jobs.length;

  const fieldCompleteness: FieldCompleteness = {
    title: jobs.filter(j => j.title && j.title.trim().length > 0).length / total,
    company: jobs.filter(j => j.companyName && j.companyName.trim().length > 0).length / total,
    location: jobs.filter(j => j.location && j.location.trim().length > 0).length / total,
    description: jobs.filter(j => j.description && j.description.trim().length > 10).length / total,
    applicationUrl: jobs.filter(j => j.applicationUrl && j.applicationUrl.trim().length > 0).length / total,
  };

  const anomalies: ExtractionAnomaly[] = [];

  if (fieldCompleteness.title < HEALTH_THRESHOLDS.titleCompleteness) {
    anomalies.push({
      field: 'title',
      currentCompleteness: fieldCompleteness.title,
      previousCompleteness: previousHealth?.fieldCompleteness?.title || 1,
      severity: fieldCompleteness.title < 0.1 ? 'high' : 'medium',
      message: `Title completeness dropped to ${(fieldCompleteness.title * 100).toFixed(1)}%`,
    });
  }

  if (fieldCompleteness.company < HEALTH_THRESHOLDS.companyCompleteness) {
    anomalies.push({
      field: 'company',
      currentCompleteness: fieldCompleteness.company,
      previousCompleteness: previousHealth?.fieldCompleteness?.company || 1,
      severity: fieldCompleteness.company < 0.1 ? 'high' : 'medium',
      message: `Company completeness dropped to ${(fieldCompleteness.company * 100).toFixed(1)}%`,
    });
  }

  if (fieldCompleteness.location < HEALTH_THRESHOLDS.locationCompleteness) {
    anomalies.push({
      field: 'location',
      currentCompleteness: fieldCompleteness.location,
      previousCompleteness: previousHealth?.fieldCompleteness?.location || 1,
      severity: fieldCompleteness.location < 0.1 ? 'high' : 'medium',
      message: `Location completeness dropped to ${(fieldCompleteness.location * 100).toFixed(1)}%`,
    });
  }

  if (fieldCompleteness.description < HEALTH_THRESHOLDS.descriptionCompleteness) {
    anomalies.push({
      field: 'description',
      currentCompleteness: fieldCompleteness.description,
      previousCompleteness: previousHealth?.fieldCompleteness?.description || 1,
      severity: fieldCompleteness.description < 0.05 ? 'high' : 'medium',
      message: `Description completeness dropped to ${(fieldCompleteness.description * 100).toFixed(1)}%`,
    });
  }

  if (recordCount === 0) {
    anomalies.push({
      field: 'record_count',
      currentCompleteness: 0,
      previousCompleteness: 1,
      severity: 'high',
      message: 'No records returned - extraction may have completely failed',
    });
  }

  if (previousHealth?.totalRecordsExtracted && recordCount > 0) {
    const dropPercent = 1 - recordCount / previousHealth.totalRecordsExtracted;
    if (dropPercent > HEALTH_THRESHOLDS.maxRecordDropPercent) {
      anomalies.push({
        field: 'record_count',
        currentCompleteness: recordCount / previousHealth.totalRecordsExtracted,
        previousCompleteness: 1,
        severity: 'high',
        message: `Record count dropped by ${(dropPercent * 100).toFixed(1)}%`,
      });
    }
  }

  const recordCountChange = previousHealth?.totalRecordsExtracted
    ? recordCount - previousHealth.totalRecordsExtracted
    : recordCount;

  const qualityChange = previousHealth?.extractionQuality
    ? (fieldCompleteness.title * 100) - previousHealth.extractionQuality
    : 0;

  return {
    isHealthy: anomalies.filter(a => a.severity === 'high').length === 0 && recordCount > 0,
    recordCount,
    requiredFieldCompleteness: fieldCompleteness,
    anomalies,
    comparisonWithPrevious: { recordCountChange, qualityChange },
  };
}

export function getFieldCompletenessPercentage(completeness: FieldCompleteness): Record<string, number> {
  return {
    Title: Math.round(completeness.title * 100),
    Company: Math.round(completeness.company * 100),
    Location: Math.round(completeness.location * 100),
    Description: Math.round(completeness.description * 100),
    'Application URL': Math.round(completeness.applicationUrl * 100),
  };
}
