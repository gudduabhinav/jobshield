/**
 * Seed script — populates Supabase with demo data.
 * Run once after creating tables: node scripts/seed.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://gavfbuveimlcysgkygab.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdmZidXZlaW1sY3lzZ2t5Z2FiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI0NTgzNiwiZXhwIjoyMTAyODIxODM2fQ.y_GSOhsAhzYscAPrMdEh1qUNacWzdJUgrCvnFP6FbNE';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const now = new Date().toISOString();

const rawJobs = [
  { title: 'Senior Software Engineer', companyName: 'Google', location: 'Mountain View, CA', description: 'We are looking for a Senior Software Engineer to join our Cloud Platform team. You will design and build scalable distributed systems, work with Kubernetes and GCP, and collaborate with cross-functional teams. Requirements: 5+ years of experience in backend development, proficiency in Go or Java, experience with cloud infrastructure.', applicationUrl: 'https://careers.google.com/jobs/results/123456/', salary: '$180,000 - $250,000', employmentType: 'Full-time', postedDate: '2026-08-15', sourceName: 'Google Careers', sourceUrl: 'https://careers.google.com', companyUrl: 'https://about.google', skills: 'Go,Java,Kubernetes,GCP,Distributed Systems', remoteStatus: 'Hybrid' },
  { title: 'Product Manager', companyName: 'Microsoft', location: 'Redmond, WA', description: 'Microsoft is hiring a Product Manager for the Azure AI Platform. You will drive product strategy, define roadmaps, and work closely with engineering teams to deliver AI-powered solutions. Must have 3+ years of product management experience and strong technical background.', applicationUrl: 'https://careers.microsoft.com/us/en/job/MSR-123456', salary: '$145,000 - $200,000', employmentType: 'Full-time', postedDate: '2026-08-14', sourceName: 'Microsoft Careers', sourceUrl: 'https://careers.microsoft.com', companyUrl: 'https://microsoft.com', skills: 'Product Management,AI,Azure,Strategy', remoteStatus: 'Hybrid' },
  { title: 'UX Designer', companyName: 'Spotify', location: 'New York, NY', description: 'Join Spotify as a UX Designer working on our mobile listening experience. You will conduct user research, create wireframes and prototypes, and collaborate with product and engineering. Portfolio required.', applicationUrl: 'https://lifeatspotify.com/jobs/ux-designer-123', salary: '$120,000 - $160,000', employmentType: 'Full-time', postedDate: '2026-08-13', sourceName: 'Spotify Careers', sourceUrl: 'https://lifeatspotify.com', companyUrl: 'https://spotify.com', skills: 'UX Design,Figma,User Research,Prototyping', remoteStatus: 'Remote' },
  { title: 'Data Analyst', companyName: 'Netflix', location: 'Los Gatos, CA', description: 'Netflix seeks a Data Analyst to support content strategy through data-driven insights. Responsibilities include building dashboards, running A/B tests, and presenting findings to leadership. SQL, Python, and Tableau proficiency required.', applicationUrl: 'https://jobs.netflix.com/data-analyst-456', salary: '$130,000 - $180,000', employmentType: 'Full-time', postedDate: '2026-08-12', sourceName: 'Netflix Careers', sourceUrl: 'https://jobs.netflix.com', companyUrl: 'https://netflix.com', skills: 'SQL,Python,Tableau,Data Analysis,Statistics', remoteStatus: 'On-site' },
  { title: 'DevOps Engineer', companyName: 'Amazon', location: 'Seattle, WA', description: 'Amazon Web Services is hiring a DevOps Engineer to manage cloud infrastructure for our enterprise customers. You will work with AWS services, Terraform, and CI/CD pipelines. 4+ years of DevOps experience required.', applicationUrl: 'https://amazon.jobs/devops-engineer-789', salary: '$155,000 - $210,000', employmentType: 'Full-time', postedDate: '2026-08-11', sourceName: 'Amazon Jobs', sourceUrl: 'https://amazon.jobs', companyUrl: 'https://amazon.com', skills: 'AWS,Terraform,CI/CD,Docker,Kubernetes', remoteStatus: 'Hybrid' },
  { title: 'Frontend Developer', companyName: 'Shopify', location: 'Ottawa, Canada', description: 'Shopify is looking for a Frontend Developer to build merchant-facing tools. You will work with React, TypeScript, and our Polaris design system. Strong understanding of web accessibility and performance optimization needed.', applicationUrl: 'https://shopify.com/careers/frontend-012', salary: '$115,000 - $155,000 CAD', employmentType: 'Full-time', postedDate: '2026-08-10', sourceName: 'Shopify Careers', sourceUrl: 'https://shopify.com/careers', companyUrl: 'https://shopify.com', skills: 'React,TypeScript,Polaris,Accessibility', remoteStatus: 'Remote' },
  { title: 'Machine Learning Engineer', companyName: 'Meta', location: 'Menlo Park, CA', description: 'Meta AI is seeking a Machine Learning Engineer to work on large language models and recommendation systems. PhD or MS in CS/ML preferred. Experience with PyTorch, distributed training, and model optimization.', applicationUrl: 'https://metacareers.com/ml-engineer-345', salary: '$190,000 - $280,000', employmentType: 'Full-time', postedDate: '2026-08-09', sourceName: 'Meta Careers', sourceUrl: 'https://metacareers.com', companyUrl: 'https://meta.com', skills: 'PyTorch,Machine Learning,NLP,Distributed Systems', remoteStatus: 'Hybrid' },
  { title: 'Technical Writer', companyName: 'Stripe', location: 'San Francisco, CA', description: 'Stripe is hiring a Technical Writer to create documentation for our payments platform APIs. You will write tutorials, API references, and integration guides. Experience with developer documentation and understanding of payment systems preferred.', applicationUrl: 'https://stripe.com/jobs/tw-678', salary: '$110,000 - $145,000', employmentType: 'Full-time', postedDate: '2026-08-08', sourceName: 'Stripe Careers', sourceUrl: 'https://stripe.com/jobs', companyUrl: 'https://stripe.com', skills: 'Technical Writing,API Documentation,Markdown', remoteStatus: 'Remote' },
  { title: 'Digital Marketing Specialist', companyName: 'GrowthForce Digital', location: 'Remote', description: 'Fast-growing startup needs a Digital Marketing Specialist. Manage social media, create content, run paid campaigns. Must have experience with Google Ads and Facebook Ads Manager. Flexible hours, work from home opportunity.', applicationUrl: 'https://growthforcedigital.com/careers/marketing', salary: '$55,000 - $75,000', employmentType: 'Full-time', postedDate: '2026-08-14', sourceName: 'Indeed', companyUrl: 'https://growthforcedigital.com', skills: 'Marketing,Social Media,Google Ads,Content Creation', remoteStatus: 'Remote' },
  { title: 'Customer Support Representative', companyName: 'TechFlow Solutions', location: 'Austin, TX', description: 'Looking for a friendly customer support representative to handle inquiries via phone and email. No experience necessary, we provide full training. Great opportunity for career growth. Excellent compensation package.', applicationUrl: 'https://techflow.solutions/apply', salary: '$35,000 - $45,000', employmentType: 'Full-time', postedDate: '2026-08-13', sourceName: 'Indeed', skills: 'Customer Service,Communication', remoteStatus: 'Hybrid' },
  { title: 'Business Development Associate', companyName: 'NexGen Partners', location: 'Chicago, IL', description: 'Join our team as a Business Development Associate. Responsibilities include prospecting, cold calling, and building client relationships. Self-motivated individuals who thrive in a fast-paced environment will succeed here.', applicationUrl: 'https://nexgenpartners.com/jobs/bda', salary: '$50,000 - $80,000', employmentType: 'Full-time', postedDate: '2026-08-12', sourceName: 'LinkedIn', skills: 'Sales,Business Development,Communication', remoteStatus: 'On-site' },
  { title: 'Content Creator', companyName: 'ViralMedia Inc', location: 'Remote', description: 'We are looking for a creative Content Creator to produce viral social media content. Must be able to create 5-10 pieces of content daily. Experience with TikTok, Instagram Reels, and YouTube Shorts. Great opportunity with unlimited growth potential.', applicationUrl: 'https://viralmedia.com/apply-now', salary: '$40,000 - $60,000', employmentType: 'Contract', postedDate: '2026-08-11', sourceName: 'Indeed', companyUrl: 'https://viralmedia.com', skills: 'Content Creation,Social Media,Video Editing', remoteStatus: 'Remote' },
  { title: 'Work From Home Data Entry - $500/Day!', companyName: '', location: 'Remote', description: 'URGENT! We need someone to do simple data entry work from home. Pay is $500 per day guaranteed. No experience needed. You just need a computer and internet. Pay a small registration fee of $50 to get started. Contact me on WhatsApp at +1-555-0123. Send your social security number for tax purposes.', applicationUrl: 'https://bit.ly/workfromhome-jobs', salary: '$500/day guaranteed', employmentType: 'Part-time', postedDate: '2026-08-15', sourceName: 'Craigslist', skills: 'Data Entry', remoteStatus: 'Remote' },
  { title: 'Immediate Start - Remote Administrative Assistant', companyName: 'Pacific Holdings LLC', location: 'Remote', description: 'Act now! Immediate start for Remote Administrative Assistant. $3,000 per week. We send you a check, you deposit it and send the difference via Western Union. This is legitimate work. Contact me on telegram @pac_holdings_hr. You will need your bank account number and routing number to receive payments.', applicationUrl: 'https://tinyurl.com/admin-jobs-2026', salary: '$3,000/week', employmentType: 'Part-time', postedDate: '2026-08-14', sourceName: 'Craigslist', skills: 'Administrative', remoteStatus: 'Remote' },
  { title: 'Investment Opportunity - Financial Advisor', companyName: 'Global Wealth Partners', location: 'Remote', description: 'Make money fast! Join our team of financial advisors. No experience needed. You will help clients invest in cryptocurrency and forex. High pay daily. Easy money. Just make an initial investment of $1,000 and watch it grow. Send money via bitcoin to get started. Guaranteed income of $5,000 per month.', applicationUrl: 'https://goo.gl/wealth-jobs', salary: '$5,000+/month guaranteed', employmentType: 'Full-time', postedDate: '2026-08-13', sourceName: 'Social Media', skills: 'Finance', remoteStatus: 'Remote' },
  { title: 'Package Handling Position - $400/Day', companyName: 'QuickShip Logistics', location: 'Multiple Locations', description: 'Join QuickShip Logistics as a Package Handler. $400 per day. Work flexible hours. Registration fee of $75 required. You will receive packages at your home and forward them. Text me at 555-9876. Unlimited earning potential. No interview needed.', applicationUrl: 'https://t.me/quickship_jobs', salary: '$400/day', employmentType: 'Part-time', postedDate: '2026-08-12', sourceName: 'Facebook', skills: 'Logistics', remoteStatus: 'Remote' },
  { title: 'Remote Software Tester - Easy Work', companyName: 'TestTech Global', location: 'Remote', description: 'Great opportunity to earn money by testing apps. Pay is $200 per test. We need your ID number and credit card details for verification. Pay a processing fee of $100. Call me at 555-1111. No experience needed. Earn money fast.', applicationUrl: 'http://suspicious-test-jobs.xyz/apply', salary: '$200/test', employmentType: 'Contract', postedDate: '2026-08-11', sourceName: 'Social Media', skills: 'Testing', remoteStatus: 'Remote' },
  { title: 'Junior Python Developer', companyName: 'DataBricks', location: 'San Francisco, CA', description: 'DataBricks is looking for a Junior Python Developer to work on our data lakehouse platform. You will write Python code for data processing pipelines, write unit tests, and participate in code reviews. Knowledge of PySpark and SQL is a plus.', applicationUrl: 'https://databricks.com/careers/jr-python-123', salary: '$100,000 - $135,000', employmentType: 'Full-time', postedDate: '2026-08-10', sourceName: 'LinkedIn', companyUrl: 'https://databricks.com', skills: 'Python,PySpark,SQL,Data Engineering', remoteStatus: 'Hybrid' },
  { title: 'Security Engineer', companyName: 'CrowdStrike', location: 'Austin, TX', description: 'CrowdStrike is hiring a Security Engineer to join our threat intelligence team. You will analyze malware, develop detection rules, and respond to incidents. CISSP or equivalent certification preferred. 3+ years of experience in cybersecurity.', applicationUrl: 'https://crowdstrike.com/careers/sec-eng-456', salary: '$140,000 - $190,000', employmentType: 'Full-time', postedDate: '2026-08-09', sourceName: 'CrowdStrike Careers', companyUrl: 'https://crowdstrike.com', skills: 'Cybersecurity,Malware Analysis,Incident Response,CISSP', remoteStatus: 'Remote' },
  { title: 'iOS Developer', companyName: 'Apple', location: 'Cupertino, CA', description: 'Apple is seeking an iOS Developer to work on the next generation of health and fitness features. You will build Swift/SwiftUI applications, collaborate with designers, and optimize for performance. Experience with HealthKit and CoreMotion is a plus.', applicationUrl: 'https://jobs.apple.com/ios-dev-789', salary: '$165,000 - $230,000', employmentType: 'Full-time', postedDate: '2026-08-08', sourceName: 'Apple Careers', companyUrl: 'https://apple.com', skills: 'Swift,SwiftUI,HealthKit,iOS Development', remoteStatus: 'On-site' },
  { title: 'Technical Support Engineer', companyName: 'Cloudflare', location: 'Austin, TX', description: 'Cloudflare needs a Technical Support Engineer to help enterprise customers with DNS, CDN, and security product issues. You will troubleshoot complex networking problems and write technical documentation. CCNA or networking experience preferred.', applicationUrl: 'https://cloudflare.com/careers/tse-012', salary: '$85,000 - $115,000', employmentType: 'Full-time', postedDate: '2026-08-07', sourceName: 'Cloudflare Careers', companyUrl: 'https://cloudflare.com', skills: 'Networking,DNS,CDN,Technical Support', remoteStatus: 'Remote' },
  { title: 'Backend Engineer', companyName: 'Stripe', location: 'San Francisco, CA', description: 'Stripe is hiring a Backend Engineer to build reliable payment infrastructure. You will work with Ruby, Java, and Go to build APIs that process billions of dollars. Strong understanding of distributed systems and database design required.', applicationUrl: 'https://stripe.com/jobs/backend-345', salary: '$170,000 - $240,000', employmentType: 'Full-time', postedDate: '2026-08-06', sourceName: 'Stripe Careers', companyUrl: 'https://stripe.com', skills: 'Ruby,Java,Go,Distributed Systems,APIs', remoteStatus: 'Hybrid' },
  { title: 'Marketing Manager', companyName: 'HubSpot', location: 'Boston, MA', description: 'HubSpot is looking for a Marketing Manager to lead demand generation campaigns. You will manage a team of 5, run multi-channel campaigns, and own the marketing budget. 5+ years of B2B marketing experience required.', applicationUrl: 'https://hubspot.com/careers/mm-678', salary: '$120,000 - $160,000', employmentType: 'Full-time', postedDate: '2026-08-05', sourceName: 'HubSpot Careers', companyUrl: 'https://hubspot.com', skills: 'Marketing,B2B,Demand Generation,Team Leadership', remoteStatus: 'Hybrid' },
  { title: 'Social Media Evaluator - Work From Home!', companyName: '', location: 'Remote', description: 'Evaluate social media posts from home. $300/day. Easy money. No skills required. Just need a phone. Pay a fee of $25 to activate your account. Contact via telegram @social_eval_hr. We need your passport number for identity verification. Get paid daily.', applicationUrl: 'https://bit.ly/sm-eval-2026', salary: '$300/day', employmentType: 'Part-time', postedDate: '2026-08-15', sourceName: 'Social Media', skills: 'Social Media', remoteStatus: 'Remote' },
  { title: 'Mystery Shopper - Earn $250/Assignment', companyName: 'Market Research Associates', location: 'Nationwide', description: 'Become a mystery shopper. We send you $2000 check, you deposit it and keep $250. Send the rest back via wire transfer. Act now, limited spots available. Contact me at mysteryshopper@gmail.com. Great opportunity, flexible schedule. Make money fast.', applicationUrl: 'https://tinyurl.com/mysteryshop22', salary: '$250/assignment', employmentType: 'Contract', postedDate: '2026-08-14', sourceName: 'Craigslist', skills: 'Mystery Shopping', remoteStatus: 'Remote' },
  { title: 'Engineering Manager', companyName: 'GitLab', location: 'Remote', description: 'GitLab is hiring an Engineering Manager to lead our CI/CD team. You will manage 8-10 engineers, define technical direction, and ensure delivery of high-quality features. Experience managing remote teams required.', applicationUrl: 'https://gitlab.com/careers/em-901', salary: '$180,000 - $230,000', employmentType: 'Full-time', postedDate: '2026-08-04', sourceName: 'GitLab Careers', companyUrl: 'https://gitlab.com', skills: 'Engineering Management,CI/CD,Remote Leadership', remoteStatus: 'Remote' },
  { title: 'Cloud Solutions Architect', companyName: 'Salesforce', location: 'San Francisco, CA', description: 'Salesforce is seeking a Cloud Solutions Architect to design enterprise CRM solutions. You will lead technical discovery sessions, create architecture diagrams, and guide implementation teams. AWS/Azure certifications preferred.', applicationUrl: 'https://salesforce.com/careers/csa-234', salary: '$160,000 - $220,000', employmentType: 'Full-time', postedDate: '2026-08-03', sourceName: 'Salesforce Careers', companyUrl: 'https://salesforce.com', skills: 'Cloud Architecture,AWS,Azure,CRM,Salesforce', remoteStatus: 'Hybrid' },
  { title: 'QA Automation Engineer', companyName: 'Atlassian', location: 'Sydney, Australia', description: 'Atlassian is looking for a QA Automation Engineer to improve our testing infrastructure. You will write Selenium and Cypress tests, maintain test suites, and work with developers to improve code quality.', applicationUrl: 'https://atlassian.com/careers/qa-auto-567', salary: '$110,000 - $150,000 AUD', employmentType: 'Full-time', postedDate: '2026-08-02', sourceName: 'Atlassian Careers', companyUrl: 'https://atlassian.com', skills: 'QA Automation,Selenium,Cypress,JavaScript', remoteStatus: 'Remote' },
  { title: 'Database Administrator', companyName: 'Oracle', location: 'Austin, TX', description: 'Oracle is hiring a Database Administrator to manage our cloud database services. You will handle database tuning, backup strategies, and migration projects. Oracle DBA certification and 5+ years of experience required.', applicationUrl: 'https://oracle.com/careers/dba-890', salary: '$125,000 - $170,000', employmentType: 'Full-time', postedDate: '2026-08-01', sourceName: 'Oracle Careers', companyUrl: 'https://oracle.com', skills: 'Oracle DB,SQL,Database Administration,Cloud', remoteStatus: 'Hybrid' },
  { title: 'Product Design Lead', companyName: 'Figma', location: 'San Francisco, CA', description: 'Figma is hiring a Product Design Lead to shape the future of collaborative design tools. You will lead a team of 4 designers, define design strategy, and create innovative features. Portfolio demonstrating systems-level thinking required.', applicationUrl: 'https://figma.com/careers/pdl-123', salary: '$175,000 - $240,000', employmentType: 'Full-time', postedDate: '2026-07-30', sourceName: 'Figma Careers', companyUrl: 'https://figma.com', skills: 'Product Design,Design Systems,Leadership,Figma', remoteStatus: 'Hybrid' },
  { title: 'Senior Software Engineer', companyName: 'Google', location: 'Mountain View, CA', description: 'We are looking for a Senior Software Engineer to join our Cloud Platform team. You will design and build scalable distributed systems, work with Kubernetes and GCP, and collaborate with cross-functional teams. Requirements: 5+ years of experience in backend development, proficiency in Go or Java, experience with cloud infrastructure.', applicationUrl: 'https://careers.google.com/jobs/results/123457/', salary: '$180,000 - $250,000', employmentType: 'Full-time', postedDate: '2026-08-16', sourceName: 'LinkedIn', companyUrl: 'https://about.google', skills: 'Go,Java,Kubernetes,GCP,Distributed Systems', remoteStatus: 'Hybrid' },
  { title: 'Work From Home Data Entry - $500/Day!', companyName: '', location: 'Remote', description: 'URGENT! We need someone to do simple data entry work from home. Pay is $500 per day guaranteed. No experience needed. You just need a computer and internet. Pay a small registration fee of $50 to get started. Contact me on WhatsApp at +1-555-0123. Send your social security number for tax purposes.', applicationUrl: 'https://bit.ly/workfromhome-jobs-new', salary: '$500/day guaranteed', employmentType: 'Part-time', postedDate: '2026-08-16', sourceName: 'Facebook', skills: 'Data Entry', remoteStatus: 'Remote' },
  { title: 'Remote Software Tester - Easy Work', companyName: 'TestTech Global', location: 'Remote', description: 'Great opportunity to earn money by testing apps. Pay is $200 per test. We need your ID number and credit card details for verification. Pay a processing fee of $100. Call me at 555-1111. No experience needed. Earn money fast.', applicationUrl: 'http://suspicious-test-jobs.xyz/apply-v2', salary: '$200/test', employmentType: 'Contract', postedDate: '2026-08-13', sourceName: 'Social Media', skills: 'Testing', remoteStatus: 'Remote' },
  { title: 'Business Development Associate', companyName: 'NexGen Partners', location: 'Chicago, IL', description: 'Join our team as a Business Development Associate. Responsibilities include prospecting, cold calling, and building client relationships. Self-motivated individuals who thrive in a fast-paced environment will succeed here.', applicationUrl: 'https://nexgenpartners.com/jobs/bda-2', salary: '$50,000 - $80,000', employmentType: 'Full-time', postedDate: '2026-08-14', sourceName: 'Indeed', skills: 'Sales,Business Development,Communication', remoteStatus: 'On-site' },
];

// Risk scoring rules (simplified for seed)
function calculateRisk(job) {
  let score = 0;
  const reasons = [];
  const text = `${job.title} ${job.description}`.toLowerCase();
  const url = (job.applicationUrl || '').toLowerCase();

  if (text.includes('registration fee') || text.includes('processing fee') || text.includes('pay a fee')) { score += 25; reasons.push({ ruleId: 'FEE_REQUIRED', name: 'Fee Required', weight: 25, description: 'Job asks for upfront payment' }); }
  if (text.includes('send your social security') || text.includes('bank account number') || text.includes('credit card details')) { score += 30; reasons.push({ ruleId: 'PII_REQUEST', name: 'PII Requested', weight: 30, description: 'Job asks for sensitive personal information' }); }
  if (text.includes('whatsapp') || text.includes('telegram') || text.includes('western union') || text.includes('wire transfer')) { score += 15; reasons.push({ ruleId: 'INFORMAL_CONTACT', name: 'Informal Contact', weight: 15, description: 'Contact via informal channels instead of company email' }); }
  if (/\$\d{3,}\/day/.test(text) || /\$\d{3,}\/week/.test(text)) { score += 20; reasons.push({ ruleId: 'HIGH_PAY_PROMISE', name: 'High Pay Promise', weight: 20, description: 'Unusually high daily/weekly pay promised' }); }
  if (text.includes('guaranteed') && (text.includes('income') || text.includes('pay') || text.includes('earning'))) { score += 15; reasons.push({ ruleId: 'GUARANTEED_INCOME', name: 'Guaranteed Income', weight: 15, description: 'Promises guaranteed income' }); }
  if (text.includes('no experience needed') || text.includes('no skills required')) { score += 5; reasons.push({ ruleId: 'NO_EXPERIENCE', name: 'No Experience Required', weight: 5, description: 'No experience needed for the role' }); }
  if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('goo.gl') || url.includes('.xyz') || url.startsWith('http://')) { score += 10; reasons.push({ ruleId: 'SUSPICIOUS_URL', name: 'Suspicious URL', weight: 10, description: 'Uses shortened or suspicious URL' }); }
  if (!job.companyName || job.companyName.trim() === '') { score += 10; reasons.push({ ruleId: 'NO_COMPANY', name: 'No Company Name', weight: 10, description: 'No company name provided' }); }
  if (text.includes('make money fast') || text.includes('easy money') || text.includes('earn money fast') || text.includes('unlimited earning')) { score += 10; reasons.push({ ruleId: 'GET_RICH_QUICK', name: 'Get-Rich-Quick Language', weight: 10, description: 'Uses get-rich-quick language' }); }
  if (text.includes('act now') || text.includes('urgent') || text.includes('limited spots')) { score += 5; reasons.push({ ruleId: 'URGENCY_LANGUAGE', name: 'Urgency Language', weight: 5, description: 'Uses high-pressure urgency tactics' }); }

  let level = 'LOW';
  if (score > 60) level = 'HIGH';
  else if (score > 30) level = 'MEDIUM';

  return { score: Math.min(score, 100), level, reasons };
}

async function seed() {
  console.log('Seeding jobs...');
  
  // Clear existing data
  await supabase.from('healing_events').delete().neq('id', '__clear__');
  await supabase.from('scraper_health').delete().neq('id', '__clear__');
  await supabase.from('scraper_runs').delete().neq('id', '__clear__');
  await supabase.from('jobs').delete().neq('id', '__clear__');

  // Insert jobs
  const jobRows = rawJobs.map((raw, i) => {
    const assessment = calculateRisk(raw);
    return {
      id: `job-demo-${i + 1}`,
      title: raw.title,
      company_name: raw.companyName,
      location: raw.location,
      description: raw.description,
      salary: raw.salary || null,
      employment_type: raw.employmentType || null,
      experience_required: null,
      posted_date: raw.postedDate || null,
      application_url: raw.applicationUrl,
      company_url: raw.companyUrl || null,
      source_url: raw.sourceUrl || null,
      source_name: raw.sourceName || 'unknown',
      skills: raw.skills ? raw.skills.split(',').map(s => s.trim()) : [],
      remote_status: raw.remoteStatus || null,
      scraped_at: now,
      risk_score: assessment.score,
      risk_level: assessment.level,
      risk_reasons: assessment.reasons,
      duplicate_group_id: null,
      is_reposted: false,
    };
  });

  const { error: jobErr } = await supabase.from('jobs').insert(jobRows);
  if (jobErr) console.error('Jobs insert error:', jobErr);
  else console.log(`Inserted ${jobRows.length} jobs`);

  // Mark duplicates
  const dupePairs = [[0, 29], [12, 30], [16, 31], [10, 32]];
  for (const [a, b] of dupePairs) {
    const groupId = `dup-${a}-${b}`;
    await supabase.from('jobs').update({ duplicate_group_id: groupId, is_reposted: b === 29 || b === 30 || b === 31 }).in('id', [`job-demo-${a + 1}`, `job-demo-${b + 1}`]);
  }

  // Insert scraper runs
  const nowMs = Date.now();
  const scraperRuns = [
    { id: 'run-1', collector_id: 'job-collector-indeed', status: 'completed', started_at: new Date(nowMs - 300000).toISOString(), completed_at: new Date(nowMs - 240000).toISOString(), records_found: 1284, valid_records: 1267, invalid_records: 17, extraction_quality: 97.8, missing_title_count: 3, missing_company_count: 8, missing_location_count: 12, missing_description_count: 5, error_message: null },
    { id: 'run-2', collector_id: 'job-collector-indeed', status: 'completed', started_at: new Date(nowMs - 3900000).toISOString(), completed_at: new Date(nowMs - 3840000).toISOString(), records_found: 1198, valid_records: 1180, invalid_records: 18, extraction_quality: 96.2, missing_title_count: 5, missing_company_count: 10, missing_location_count: 8, missing_description_count: 4, error_message: null },
    { id: 'run-3', collector_id: 'job-collector-indeed', status: 'failed', started_at: new Date(nowMs - 86400000).toISOString(), completed_at: new Date(nowMs - 86340000).toISOString(), records_found: 0, valid_records: 0, invalid_records: 0, extraction_quality: 0, missing_title_count: 0, missing_company_count: 0, missing_location_count: 0, missing_description_count: 0, error_message: 'Extraction failed: source layout changed, CSS selectors returned 0 results' },
    { id: 'run-4', collector_id: 'job-collector-linkedin', status: 'completed', started_at: new Date(nowMs - 7200000).toISOString(), completed_at: new Date(nowMs - 7140000).toISOString(), records_found: 856, valid_records: 841, invalid_records: 15, extraction_quality: 98.1, missing_title_count: 2, missing_company_count: 5, missing_location_count: 7, missing_description_count: 3, error_message: null },
  ];
  const { error: runErr } = await supabase.from('scraper_runs').insert(scraperRuns);
  if (runErr) console.error('Runs insert error:', runErr);
  else console.log(`Inserted ${scraperRuns.length} scraper runs`);

  // Insert scraper health
  const health = {
    id: 'health-1', collector_id: 'job-collector-indeed', status: 'HEALTHY',
    last_successful_run: new Date(nowMs - 300000).toISOString(),
    last_failed_run: new Date(nowMs - 86400000).toISOString(),
    total_records_extracted: 1284, extraction_quality: 97.8,
    field_completeness: { title: 0.992, company: 0.987, location: 0.971, description: 0.964, applicationUrl: 0.958 },
    recovery_rate: 100, total_healing_events: 3, average_recovery_time: 120,
  };
  const { error: healthErr } = await supabase.from('scraper_health').insert(health);
  if (healthErr) console.error('Health insert error:', healthErr);
  else console.log('Inserted scraper health');

  // Insert healing events
  const healingEvents = [
    { id: 'heal-1', collector_id: 'job-collector-indeed', failure_type: 'extraction_degradation', failed_field: 'title', previous_record_count: 1198, failed_record_count: 0, previous_completeness: 0.98, current_completeness: 0.04, healing_status: 'recovered', started_at: new Date(nowMs - 86400000).toISOString(), completed_at: new Date(nowMs - 86340000).toISOString(), recovered_record_count: 1198, recovery_percentage: 100 },
    { id: 'heal-2', collector_id: 'job-collector-indeed', failure_type: 'extraction_degradation', failed_field: 'company', previous_record_count: 1050, failed_record_count: 420, previous_completeness: 0.97, current_completeness: 0.45, healing_status: 'recovered', started_at: new Date(nowMs - 172800000).toISOString(), completed_at: new Date(nowMs - 172740000).toISOString(), recovered_record_count: 1050, recovery_percentage: 100 },
    { id: 'heal-3', collector_id: 'job-collector-indeed', failure_type: 'schema_change', failed_field: 'location', previous_record_count: 980, failed_record_count: 120, previous_completeness: 0.96, current_completeness: 0.12, healing_status: 'recovered', started_at: new Date(nowMs - 259200000).toISOString(), completed_at: new Date(nowMs - 259140000).toISOString(), recovered_record_count: 980, recovery_percentage: 100 },
  ];
  const { error: healErr } = await supabase.from('healing_events').insert(healingEvents);
  if (healErr) console.error('Healing insert error:', healErr);
  else console.log(`Inserted ${healingEvents.length} healing events`);

  console.log('\nSeed complete!');
}

seed().catch(console.error);
