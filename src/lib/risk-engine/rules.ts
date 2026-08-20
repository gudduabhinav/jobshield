import { RiskRule } from '@/types/risk';

export const riskRules: RiskRule[] = [
  {
    id: 'missing-company',
    name: 'Missing Company Information',
    weight: 20,
    description: 'No company name provided in the listing',
    detect: (job) => !job.companyName || job.companyName.trim().length === 0,
  },
  {
    id: 'missing-company-url',
    name: 'Missing Company Website',
    weight: 10,
    description: 'No company website URL provided',
    detect: (job) => !job.companyUrl || job.companyUrl.trim().length === 0,
  },
  {
    id: 'payment-deposit-request',
    name: 'Payment or Deposit Request',
    weight: 30,
    description: 'Job posting requests payment, deposit, or money transfer',
    detect: (job) => {
      const text = job.description.toLowerCase();
      return (
        text.includes('pay a fee') ||
        text.includes('pay a deposit') ||
        text.includes('upfront payment') ||
        text.includes('initial investment') ||
        text.includes('send money') ||
        text.includes('wire transfer') ||
        text.includes('money order') ||
        text.includes('western union') ||
        text.includes('bitcoin payment') ||
        text.includes('crypto payment') ||
        text.includes('registration fee') ||
        text.includes('processing fee') ||
        text.includes('training fee') ||
        text.includes('fee required') ||
        text.includes('small fee')
      );
    },
  },
  {
    id: 'suspicious-application-domain',
    name: 'Suspicious Application Domain',
    weight: 20,
    description: 'Application URL points to a suspicious or unrelated domain',
    detect: (job) => {
      if (!job.applicationUrl) return true;
      const url = job.applicationUrl.toLowerCase();
      const suspiciousPatterns = [
        'bit.ly', 'tinyurl', 'goo.gl', 't.co',
        'forms.gle', 'docs.google.com/forms',
        'suspicious', 'free-money', 'earn-now',
        'telegram.org', 't.me',
      ];
      return suspiciousPatterns.some(p => url.includes(p));
    },
  },
  {
    id: 'urgent-payment-language',
    name: 'Urgent Payment Language',
    weight: 15,
    description: 'Job description contains suspicious urgency or payment language',
    detect: (job) => {
      const text = job.description.toLowerCase();
      return (
        (text.includes('urgent') && text.includes('payment')) ||
        (text.includes('act now') && text.includes('money')) ||
        text.includes('guaranteed income') ||
        text.includes('earn $') ||
        text.includes('make money fast') ||
        text.includes('no experience needed') && text.includes('high pay') ||
        text.includes('unlimited earning') ||
        text.includes('easy money') ||
        text.includes('get paid daily')
      );
    },
  },
  {
    id: 'personal-info-request',
    name: 'Requests Sensitive Personal Information',
    weight: 25,
    description: 'Job asks for personal information like SSN, bank details early in the process',
    detect: (job) => {
      const text = job.description.toLowerCase();
      return (
        text.includes('social security') ||
        text.includes('ssn') ||
        text.includes('bank account number') ||
        text.includes('routing number') ||
        text.includes('credit card') ||
        text.includes('passport number') ||
        text.includes('id number') ||
        text.includes('driver license') ||
        text.includes('drivers license')
      );
    },
  },
  {
    id: 'generic-description',
    name: 'Extremely Generic Description',
    weight: 10,
    description: 'Job description is very short or generic with no specific details',
    detect: (job) => {
      const desc = job.description.trim();
      if (desc.length < 50) return true;
      const genericPhrases = [
        'work from home',
        'flexible hours',
        'unlimited income',
        'be your own boss',
        'join our team',
        'great opportunity',
        'excellent compensation',
      ];
      const matchCount = genericPhrases.filter(p => desc.toLowerCase().includes(p)).length;
      return matchCount >= 3;
    },
  },
  {
    id: 'reposted-listing',
    name: 'Reposted or Duplicate Listing',
    weight: 10,
    description: 'This job listing appears to be a reposted duplicate',
    detect: (job) => job.isReposted || (job.duplicateGroupId !== null),
  },
  {
    id: 'unrealistic-salary',
    name: 'Unrealistic Salary Claim',
    weight: 15,
    description: 'Salary claim seems unrealistically high for the described role',
    detect: (job) => {
      if (!job.salary) return false;
      const salary = job.salary.toLowerCase();
      const highPatterns = [
        /\$\d{4,}\/week/,
        /\$\d{3,}\/day/,
        /\$10,000/,
        /\$50,000.*month/,
        /\$100,000/,
        /six.figure/,
        /7 figure/,
        /8 figure/,
      ];
      return highPatterns.some(p => p.test(salary));
    },
  },
  {
    id: 'external-contact',
    name: 'Suspicious External Contact Instructions',
    weight: 15,
    description: 'Job directs to contact via personal email or messaging apps',
    detect: (job) => {
      const text = job.description.toLowerCase();
      return (
        text.includes('contact me on whatsapp') ||
        text.includes('contact me on telegram') ||
        text.includes('text me at') ||
        text.includes('call me at') ||
        text.includes('gmail.com') && !text.includes('apply through') ||
        text.includes('outlook.com') && !text.includes('apply through') ||
        text.includes('yahoo.com') && !text.includes('apply through')
      );
    },
  },
];
