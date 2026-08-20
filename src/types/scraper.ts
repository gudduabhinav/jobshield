import type { ScraperStatus, ScraperRunStatus, HealingStatus } from './jobs';
export type { ScraperStatus, ScraperRunStatus, HealingStatus } from './jobs';

export interface ScraperRun {
  id: string;
  collectorId: string;
  status: ScraperRunStatus;
  startedAt: string;
  completedAt: string | null;
  recordsFound: number;
  validRecords: number;
  invalidRecords: number;
  extractionQuality: number;
  missingTitleCount: number;
  missingCompanyCount: number;
  missingLocationCount: number;
  missingDescriptionCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ScraperHealth {
  id: string;
  collectorId: string;
  status: ScraperStatus;
  lastSuccessfulRun: string | null;
  lastFailedRun: string | null;
  totalRecordsExtracted: number;
  extractionQuality: number;
  fieldCompleteness: FieldCompleteness;
  recoveryRate: number;
  totalHealingEvents: number;
  averageRecoveryTime: number;
  updatedAt: string;
}

export interface FieldCompleteness {
  title: number;
  company: number;
  location: number;
  description: number;
  applicationUrl: number;
}

export interface HealingEvent {
  id: string;
  collectorId: string;
  failureType: string;
  failedField: string;
  previousRecordCount: number;
  failedRecordCount: number;
  previousCompleteness: number;
  currentCompleteness: number;
  healingStatus: HealingStatus;
  startedAt: string;
  completedAt: string | null;
  recoveredRecordCount: number;
  recoveryPercentage: number;
  createdAt: string;
}

export interface ExtractionValidationResult {
  isHealthy: boolean;
  recordCount: number;
  requiredFieldCompleteness: FieldCompleteness;
  anomalies: ExtractionAnomaly[];
  comparisonWithPrevious: {
    recordCountChange: number;
    qualityChange: number;
  };
}

export interface ExtractionAnomaly {
  field: string;
  currentCompleteness: number;
  previousCompleteness: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface DashboardStats {
  totalJobs: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  scraperStatus: ScraperStatus;
  lastSuccessfulRun: string | null;
  healingEvents: number;
  recoveryRate: number;
  jobsOverTime: { date: string; count: number }[];
  riskDistribution: { level: string; count: number }[];
  extractionQuality: { date: string; quality: number }[];
}
