import { validateExtraction } from '@/lib/bright-data/health';
import { JobRecord } from '@/types/jobs';

function createJob(overrides: Partial<JobRecord> = {}): JobRecord {
  return {
    id: 'test-1',
    title: 'Software Engineer',
    companyName: 'Tech Corp',
    location: 'San Francisco, CA',
    description: 'A great software engineering position with competitive compensation',
    salary: '$150,000',
    employmentType: 'Full-time',
    experienceRequired: '3+ years',
    postedDate: '2026-01-01',
    applicationUrl: 'https://techcorp.com/apply',
    companyUrl: 'https://techcorp.com',
    sourceUrl: null,
    sourceName: 'LinkedIn',
    skills: ['JavaScript', 'React'],
    remoteStatus: 'Remote',
    scrapedAt: new Date().toISOString(),
    riskScore: 0,
    riskLevel: 'LOW',
    riskReasons: [],
    duplicateGroupId: null,
    isReposted: false,
    ...overrides,
  };
}

describe('Extraction Validator', () => {
  test('healthy extraction with valid jobs', () => {
    const jobs = [createJob(), createJob({ id: 'test-2' }), createJob({ id: 'test-3' })];
    const rawData = [{}, {}, {}];
    const result = validateExtraction(jobs, rawData);
    expect(result.isHealthy).toBe(true);
    expect(result.recordCount).toBe(3);
  });

  test('detects zero records as unhealthy', () => {
    const result = validateExtraction([], []);
    expect(result.isHealthy).toBe(false);
    expect(result.anomalies.some(a => a.field === 'record_count')).toBe(true);
  });

  test('detects missing titles', () => {
    const jobs = [
      createJob({ id: '1', title: '' }),
      createJob({ id: '2', title: '' }),
      createJob({ id: '3', title: 'Valid Title' }),
    ];
    const result = validateExtraction(jobs, [{}, {}, {}]);
    expect(result.requiredFieldCompleteness.title).toBeLessThan(1);
  });

  test('detects missing company names', () => {
    const jobs = [
      createJob({ id: '1', companyName: '' }),
      createJob({ id: '2', companyName: 'Valid' }),
    ];
    const result = validateExtraction(jobs, [{}, {}]);
    expect(result.requiredFieldCompleteness.company).toBeLessThan(1);
  });

  test('detects record count drop', () => {
    const jobs = [createJob()];
    const result = validateExtraction(jobs, [{}], { totalRecordsExtracted: 100 });
    expect(result.comparisonWithPrevious.recordCountChange).toBe(-99);
  });

  test('returns field completeness percentages', () => {
    const jobs = [
      createJob({ id: '1', title: 'A', companyName: 'B', location: 'C', description: 'Long enough description text' }),
      createJob({ id: '2', title: 'D', companyName: '', location: 'F', description: 'Another long enough description' }),
    ];
    const result = validateExtraction(jobs, [{}, {}]);
    expect(result.requiredFieldCompleteness.title).toBe(1);
    expect(result.requiredFieldCompleteness.company).toBe(0.5);
  });
});
