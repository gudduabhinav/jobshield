export interface RiskRule {
  id: string;
  name: string;
  weight: number;
  description: string;
  detect: (job: { title: string; companyName: string; description: string; applicationUrl: string; companyUrl: string | null; salary: string | null; contactEmail?: string | null; isReposted: boolean; duplicateGroupId: string | null }) => boolean;
}

export interface RiskAssessment {
  jobId: string;
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: { ruleId: string; name: string; weight: number; description: string }[];
  assessedAt: string;
}
