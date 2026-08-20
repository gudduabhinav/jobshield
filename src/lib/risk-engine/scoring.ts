import { RiskRule } from '@/types/risk';
import { JobRecord, RiskLevel } from '@/types/jobs';
import { riskRules } from './rules';

export function calculateRiskScore(
  job: Pick<JobRecord, 'title' | 'companyName' | 'description' | 'applicationUrl' | 'companyUrl' | 'salary' | 'isReposted' | 'duplicateGroupId'> & { contactEmail?: string | null },
  rules: RiskRule[] = riskRules
): { score: number; level: RiskLevel; reasons: { ruleId: string; name: string; weight: number; description: string }[] } {
  let totalScore = 0;
  const triggeredReasons: { ruleId: string; name: string; weight: number; description: string }[] = [];

  for (const rule of rules) {
    try {
      if (rule.detect({ ...job, contactEmail: job.contactEmail ?? null })) {
        totalScore += rule.weight;
        triggeredReasons.push({
          ruleId: rule.id,
          name: rule.name,
          weight: rule.weight,
          description: rule.description,
        });
      }
    } catch {
      // If a rule fails to execute, skip it
    }
  }

  const clampedScore = Math.min(Math.max(totalScore, 0), 100);
  const level = getRiskLevel(clampedScore);

  return {
    score: clampedScore,
    level,
    reasons: triggeredReasons,
  };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

export function assessAllJobs(jobs: Partial<JobRecord>[]): Partial<JobRecord>[] {
  return jobs.map(job => {
    const assessment = calculateRiskScore({
      title: job.title || '',
      companyName: job.companyName || '',
      description: job.description || '',
      applicationUrl: job.applicationUrl || '',
      companyUrl: job.companyUrl || null,
      salary: job.salary || null,
      isReposted: job.isReposted || false,
      duplicateGroupId: job.duplicateGroupId || null,
      contactEmail: null,
    });

    return {
      ...job,
      riskScore: assessment.score,
      riskLevel: assessment.level,
      riskReasons: assessment.reasons,
    };
  });
}
