import * as cheerio from 'cheerio';

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary: string | null;
  tags: string[];
}

interface ScrapeResult {
  url: string;
  title: string;
  jobs: ScrapedJob[];
  method: string;
  scrapedAt: string;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function extractFromJsonLd($: cheerio.CheerioAPI): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'JobPosting') {
          jobs.push({
            title: cleanText(item.title || item.name || ''),
            company: cleanText(item.hiringOrganization?.name || item.employmentAuthority?.name || ''),
            location: cleanText(item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion || ''),
            description: cleanText(typeof item.description === 'string' ? item.description : ''),
            url: item.url || item.title || '',
            salary: item.baseSalary?.value?.value ? `${item.baseSalary.value.currency} ${item.baseSalary.value.value}` : null,
            tags: item.occupationalCategory ? [item.occupationalCategory] : [],
          });
        }
      }
    } catch { /* skip invalid JSON-LD */ }
  });
  return jobs;
}

function extractFromMicrodata($: cheerio.CheerioAPI): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  $('[itemtype*="JobPosting"]').each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.find('[itemprop="title"]').text() || $el.find('h2, h3').first().text());
    const company = cleanText($el.find('[itemprop="name"]').first().text() || $el.find('[itemprop="hiringOrganization"] [itemprop="name"]').text());
    const location = cleanText($el.find('[itemprop="addressLocality"]').text() || $el.find('[itemprop="jobLocation"]').text());
    const desc = cleanText($el.find('[itemprop="description"]').text());
    if (title) {
      jobs.push({ title, company, location, description: desc.substring(0, 2000), url: '', salary: null, tags: [] });
    }
  });
  return jobs;
}

function extractFromCommonSelectors($: cheerio.CheerioAPI, baseUrl: string): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const jobSelectors = [
    '.job-listing', '.job-card', '.job-item', '.job-post', '.job-listing-item',
    '.listing-item', '.career-item', '.position-item', '.opening-item',
    'article[data-job-id]', 'div[data-job-id]', '.vacancy', '.role-card',
    '.search-result', '.result-item',
  ];

  for (const selector of jobSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const $el = $(el);
        const title = cleanText(
          $el.find('h2, h3, h4, .title, .job-title, .position-title, [class*="title"]').first().text()
        );
        const company = cleanText(
          $el.find('.company, .company-name, .employer, [class*="company"], [class*="employer"]').first().text()
        );
        const location = cleanText(
          $el.find('.location, .job-location, [class*="location"]').first().text()
        );
        const desc = cleanText(
          $el.find('.description, .job-description, .summary, p').first().text()
        );
        const link = $el.find('a').first().attr('href') || '';
        const fullUrl = link.startsWith('http') ? link : (link.startsWith('/') ? new URL(link, baseUrl).href : baseUrl);

        if (title) {
          jobs.push({
            title: title.substring(0, 200),
            company: company || 'Unknown',
            location: location || 'Not specified',
            description: desc.substring(0, 2000),
            url: fullUrl,
            salary: null,
            tags: [],
          });
        }
      });
      if (jobs.length > 0) break;
    }
  }
  return jobs;
}

function extractFromHeadings($: cheerio.CheerioAPI, baseUrl: string): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const headings = $('h1, h2, h3');

  headings.each((_, el) => {
    const $heading = $(el);
    const title = cleanText($heading.text());
    if (!title || title.length < 3 || title.length > 200) return;

    const container = $heading.closest('div, section, article, li');
    const nearbyText = container.length ? cleanText(container.text().substring(0, 500)) : '';

    const hasJobIndicator = /job|position|role|opening|hiring|career|vacancy|intern|engineer|developer|manager|designer|analyst|specialist|lead|director|architect/i.test(title);
    if (hasJobIndicator) {
      const link = $heading.find('a').attr('href') || container.find('a').first().attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : (link.startsWith('/') ? new URL(link, baseUrl).href : baseUrl);
      jobs.push({
        title,
        company: 'Scraped from page',
        location: 'Not specified',
        description: nearbyText.substring(0, 2000),
        url: fullUrl,
        salary: null,
        tags: [],
      });
    }
  });
  return jobs;
}

function extractTextContent($: cheerio.CheerioAPI, pageUrl: string): ScrapedJob[] {
  const title = cleanText($('title').text());
  const metaDesc = cleanText($('meta[name="description"]').attr('content') || '');
  const bodyText = cleanText($('body').text().substring(0, 5000));
  const h1 = cleanText($('h1').first().text());
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('job') || href.includes('career') || href.includes('position') || href.includes('opening'))) {
      links.push(href);
    }
  });

  return [{
    title: h1 || title,
    company: 'Scraped from ' + new URL(pageUrl).hostname,
    location: 'Not specified',
    description: (metaDesc + ' ' + bodyText).substring(0, 2000),
    url: pageUrl,
    salary: null,
    tags: links.slice(0, 10).map(l => l.split('/').pop() || '').filter(Boolean),
  }];
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  let targetUrl = url;
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, noscript, nav, footer, header').remove();

  let jobs: ScrapedJob[] = [];
  let method = '';

  // Try extraction methods in order of specificity
  const jsonLdJobs = extractFromJsonLd($);
  if (jsonLdJobs.length > 0) {
    jobs = jsonLdJobs;
    method = 'json-ld';
  }

  if (jobs.length === 0) {
    const microdataJobs = extractFromMicrodata($);
    if (microdataJobs.length > 0) {
      jobs = microdataJobs;
      method = 'microdata';
    }
  }

  if (jobs.length === 0) {
    const selectorJobs = extractFromCommonSelectors($, targetUrl);
    if (selectorJobs.length > 0) {
      jobs = selectorJobs;
      method = 'common-selectors';
    }
  }

  if (jobs.length === 0) {
    const headingJobs = extractFromHeadings($, targetUrl);
    if (headingJobs.length > 0) {
      jobs = headingJobs;
      method = 'heading-analysis';
    }
  }

  if (jobs.length === 0) {
    const fallbackJobs = extractTextContent($, targetUrl);
    jobs = fallbackJobs;
    method = 'text-fallback';
  }

  return {
    url: targetUrl,
    title: cleanText($('title').text()) || targetUrl,
    jobs,
    method,
    scrapedAt: new Date().toISOString(),
  };
}