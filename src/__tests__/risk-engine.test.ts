import { calculateRiskScore, getRiskLevel } from '@/lib/risk-engine/scoring';
import { riskRules } from '@/lib/risk-engine/rules';

describe('Risk Engine', () => {
  const lowRiskJob = {
    title: 'Senior Software Engineer',
    companyName: 'Google',
    description: 'We are looking for a Senior Software Engineer to join our Cloud Platform team. You will design and build scalable distributed systems.',
    applicationUrl: 'https://careers.google.com/jobs/results/123456/',
    companyUrl: 'https://about.google',
    salary: '$180,000 - $250,000',
    isReposted: false,
    duplicateGroupId: null,
  };

  const highRiskJob = {
    title: 'Work From Home Data Entry - $500/Day!',
    companyName: '',
    description: 'URGENT! We need someone to do simple data entry work from home. Pay is $500 per day guaranteed. No experience needed. Pay a small registration fee of $50 to get started. Contact me on WhatsApp at +1-555-0123. Send your social security number for tax purposes.',
    applicationUrl: 'https://bit.ly/workfromhome-jobs',
    companyUrl: null,
    salary: '$500/day guaranteed',
    isReposted: true,
    duplicateGroupId: 'dup-test',
  };

  test('low risk job should have score <= 30', () => {
    const result = calculateRiskScore(lowRiskJob);
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.level).toBe('LOW');
  });

  test('high risk job should have score > 60', () => {
    const result = calculateRiskScore(highRiskJob);
    expect(result.score).toBeGreaterThan(60);
    expect(result.level).toBe('HIGH');
  });

  test('high risk job should trigger multiple rules', () => {
    const result = calculateRiskScore(highRiskJob);
    expect(result.reasons.length).toBeGreaterThan(3);
  });

  test('missing company should add weight', () => {
    const job = { ...lowRiskJob, companyName: '' };
    const result = calculateRiskScore(job);
    const missingCompany = result.reasons.find(r => r.ruleId === 'missing-company');
    expect(missingCompany).toBeDefined();
    expect(missingCompany!.weight).toBe(20);
  });

  test('payment language should be detected', () => {
    const job = { ...lowRiskJob, description: 'Please pay a fee of $100 to register' };
    const result = calculateRiskScore(job);
    const payment = result.reasons.find(r => r.ruleId === 'payment-deposit-request');
    expect(payment).toBeDefined();
  });

  test('suspicious domain should be detected', () => {
    const job = { ...lowRiskJob, applicationUrl: 'https://bit.ly/some-job' };
    const result = calculateRiskScore(job);
    const domain = result.reasons.find(r => r.ruleId === 'suspicious-application-domain');
    expect(domain).toBeDefined();
  });

  test('reposted job should be flagged', () => {
    const job = { ...lowRiskJob, isReposted: true };
    const result = calculateRiskScore(job);
    const repost = result.reasons.find(r => r.ruleId === 'reposted-listing');
    expect(repost).toBeDefined();
  });

  test('getRiskLevel returns correct levels', () => {
    expect(getRiskLevel(0)).toBe('LOW');
    expect(getRiskLevel(30)).toBe('LOW');
    expect(getRiskLevel(31)).toBe('MEDIUM');
    expect(getRiskLevel(60)).toBe('MEDIUM');
    expect(getRiskLevel(61)).toBe('HIGH');
    expect(getRiskLevel(100)).toBe('HIGH');
  });

  test('score is clamped between 0 and 100', () => {
    const job = {
      title: '',
      companyName: '',
      description: 'pay a fee send money social security credit card easy money guaranteed income bitcoin payment',
      applicationUrl: 'https://bit.ly/test',
      companyUrl: null,
      salary: '$500/day guaranteed',
      isReposted: true,
      duplicateGroupId: 'dup-test',
    };
    const result = calculateRiskScore(job);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
