import { JobRecord } from '@/types/jobs';
import { normalizeDescription, generateDescriptionHash, normalizeJobKey } from './normalize';

export interface DuplicateGroup {
  groupId: string;
  jobs: JobRecord[];
  firstSeenAt: string;
  lastSeenAt: string;
  isReposted: boolean;
}

export function detectExactDuplicates(jobs: JobRecord[]): Map<string, JobRecord[]> {
  const groups = new Map<string, JobRecord[]>();

  for (const job of jobs) {
    const key = normalizeJobKey(job.title, job.companyName, job.location);
    const existing = groups.get(key) || [];
    existing.push(job);
    groups.set(key, existing);
  }

  return groups;
}

export function detectNearDuplicates(jobs: JobRecord[], threshold: number = 0.85): Map<string, JobRecord[]> {
  const descriptionMap = new Map<string, JobRecord[]>();
  const groups = new Map<string, JobRecord[]>();

  for (const job of jobs) {
    const descHash = generateDescriptionHash(job.description);
    const existing = descriptionMap.get(descHash) || [];
    existing.push(job);
    descriptionMap.set(descHash, existing);
  }

  for (const [hash, groupJobs] of descriptionMap) {
    if (groupJobs.length > 1) {
      groups.set(`near-${hash}`, groupJobs);
    }
  }

  return groups;
}

export function findDuplicateGroups(jobs: JobRecord[]): DuplicateGroup[] {
  const exactGroups = detectExactDuplicates(jobs);
  const nearGroups = detectNearDuplicates(jobs);
  const allGroups: DuplicateGroup[] = [];
  const processedJobIds = new Set<string>();

  for (const [key, groupJobs] of exactGroups) {
    if (groupJobs.length > 1) {
      const jobIds = groupJobs.map(j => j.id);
      if (jobIds.some(id => processedJobIds.has(id))) continue;

      const dates = groupJobs.map(j => j.scrapedAt).sort();
      jobIds.forEach(id => processedJobIds.add(id));

      allGroups.push({
        groupId: `dup-${key}`,
        jobs: groupJobs,
        firstSeenAt: dates[0],
        lastSeenAt: dates[dates.length - 1],
        isReposted: dates.length > 1 && 
          new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime() > 86400000,
      });
    }
  }

  for (const [key, groupJobs] of nearGroups) {
    if (groupJobs.length > 1) {
      const remaining = groupJobs.filter(j => !processedJobIds.has(j.id));
      if (remaining.length > 1) {
        const dates = remaining.map(j => j.scrapedAt).sort();
        remaining.forEach(j => processedJobIds.add(j.id));

        allGroups.push({
          groupId: `near-${key}`,
          jobs: remaining,
          firstSeenAt: dates[0],
          lastSeenAt: dates[dates.length - 1],
          isReposted: dates.length > 1 &&
            new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime() > 86400000,
        });
      }
    }
  }

  return allGroups;
}

export function annotateDuplicates(jobs: JobRecord[]): JobRecord[] {
  const groups = findDuplicateGroups(jobs);
  const jobIdToGroup = new Map<string, DuplicateGroup>();

  for (const group of groups) {
    for (const job of group.jobs) {
      jobIdToGroup.set(job.id, group);
    }
  }

  return jobs.map(job => {
    const group = jobIdToGroup.get(job.id);
    if (group) {
      return {
        ...job,
        duplicateGroupId: group.groupId,
        isReposted: group.isReposted,
      };
    }
    return job;
  });
}
