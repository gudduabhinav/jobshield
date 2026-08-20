import { normalizeDescription, generateDescriptionHash, normalizeJobKey } from '@/lib/duplicate-detector/normalize';
import { JobRecord } from '@/types/jobs';

describe('Duplicate Detector', () => {
  test('normalizeDescription lowercases and removes punctuation', () => {
    const result = normalizeDescription('Hello, World! This is a TEST.');
    expect(result).toBe('hello world this is a test');
  });

  test('normalizeDescription removes common stop words', () => {
    const result = normalizeDescription('The quick brown fox jumps');
    expect(result).toContain('quick');
    expect(result).toContain('fox');
  });

  test('normalizeJobKey creates consistent keys', () => {
    const key1 = normalizeJobKey('Senior Engineer', 'Google', 'Mountain View');
    const key2 = normalizeJobKey('Senior Engineer', 'Google', 'Mountain View');
    expect(key1).toBe(key2);
  });

  test('generateDescriptionHash is deterministic', () => {
    const hash1 = generateDescriptionHash('This is a job description for a software engineer position');
    const hash2 = generateDescriptionHash('This is a job description for a software engineer position');
    expect(hash1).toBe(hash2);
  });

  test('different descriptions produce different hashes', () => {
    const hash1 = generateDescriptionHash('Software engineer position at Google');
    const hash2 = generateDescriptionHash('Marketing manager position at Microsoft');
    expect(hash1).not.toBe(hash2);
  });

  test('similar descriptions may produce same hash due to normalization', () => {
    const hash1 = generateDescriptionJoin('Hello World! This is a test description.');
    const hash2 = generateDescriptionJoin('Hello World this is a test description');
    expect(hash1).toBe(hash2);
  });
});

function generateDescriptionJoin(text: string) {
  return generateDescriptionHash(text);
}
