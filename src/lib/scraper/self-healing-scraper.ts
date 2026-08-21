import * as cheerio from 'cheerio';
import { db } from '@/lib/db';

export interface ScrapedItem {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary: string | null;
  tags: string[];
}

export interface HealingEvent {
  id: string;
  url: string;
  phase: string;
  strategy: string;
  success: boolean;
  errorBefore: string;
  errorAfter: string | null;
  itemsFound: number;
  timestamp: string;
}

export interface ScrapeAttempt {
  method: string;
  strategy: string;
  items: ScrapedItem[];
  success: boolean;
  error: string | null;
  durationMs: number;
}

export interface SelfHealingResult {
  url: string;
  pageTitle: string;
  finalMethod: string;
  totalItems: number;
  attempts: ScrapeAttempt[];
  healingEvents: HealingEvent[];
  succeeded: boolean;
  scrapedAt: string;
}

const FETCH_STRATEGIES = [
  {
    name: 'standard',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  {
    name: 'googlebot',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  },
  {
    name: 'mobile',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  {
    name: 'curl-like',
    headers: {
      'User-Agent': 'curl/8.4.0',
      'Accept': '*/*',
    },
  },
];

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function extractJsonLd($: cheerio.CheerioAPI): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (item['@type'] === 'JobPosting' || item['@type'] === 'Product' || item['@type'] === 'Article') {
          items.push({
            title: cleanText(item.title || item.name || ''),
            company: cleanText(item.hiringOrganization?.name || item.brand?.name || item.publisher?.name || ''),
            location: cleanText(item.jobLocation?.address?.addressLocality || item.availableAtOrFrom?.address?.addressLocality || ''),
            description: cleanText(typeof item.description === 'string' ? item.description : ''),
            url: item.url || '',
            salary: item.baseSalary?.value?.value ? `${item.baseSalary.value.currency} ${item.baseSalary.value.value}` : null,
            tags: item.occupationalCategory ? [item.occupationalCategory] : [],
          });
        }
      }
    } catch { /* skip */ }
  });
  return items;
}

function extractMicrodata($: cheerio.CheerioAPI): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  $('[itemtype]').each((_, el) => {
    const $el = $(el);
    const itemtype = $el.attr('itemtype') || '';
    if (!itemtype.includes('JobPosting') && !itemtype.includes('Product') && !itemtype.includes('Article')) return;

    const title = cleanText($el.find('[itemprop="title"]').text() || $el.find('h2, h3').first().text());
    const company = cleanText($el.find('[itemprop="name"]').first().text());
    const location = cleanText($el.find('[itemprop="addressLocality"], [itemprop="jobLocation"]').first().text());
    const desc = cleanText($el.find('[itemprop="description"]').text());

    if (title) {
      items.push({ title, company, location, description: desc.substring(0, 2000), url: '', salary: null, tags: [] });
    }
  });
  return items;
}

function extractBySelectors($: cheerio.CheerioAPI, baseUrl: string): ScrapedItem[] {
  const selectors = [
    '.job-listing', '.job-card', '.job-item', '.job-post', '.listing-item',
    '.career-item', '.position-item', '.opening-item', 'article[data-job-id]',
    'div[data-job-id]', '.vacancy', '.role-card', '.search-result', '.result-item',
    '.card', '.post', 'article', '.item',
  ];

  for (const sel of selectors) {
    const els = $(sel);
    if (els.length < 2) continue;

    const items: ScrapedItem[] = [];
    els.each((_, el) => {
      const $el = $(el);
      const title = cleanText($el.find('h2, h3, h4, .title, [class*="title"], [class*="name"]').first().text());
      const company = cleanText($el.find('.company, [class*="company"], [class*="employer"], [class*="brand"]').first().text());
      const location = cleanText($el.find('.location, [class*="location"], [class*="place"]').first().text());
      const desc = cleanText($el.find('.description, [class*="description"], [class*="summary"], p').first().text());
      const link = $el.find('a').first().attr('href') || '';
      const fullUrl = link.startsWith('http') ? link : (link.startsWith('/') ? new URL(link, baseUrl).href : baseUrl);

      if (title && title.length > 2) {
        items.push({
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

    if (items.length >= 2) return items;
  }
  return [];
}

function extractByHeadings($: cheerio.CheerioAPI, baseUrl: string): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const indicators = /job|position|role|opening|hiring|career|vacancy|intern|engineer|developer|manager|designer|analyst|specialist|lead|director|architect|senior|junior|staff|principal/i;

  $('h1, h2, h3').each((_, el) => {
    const $heading = $(el);
    const title = cleanText($heading.text());
    if (!title || title.length < 3 || title.length > 200 || !indicators.test(title)) return;

    const container = $heading.closest('div, section, article, li');
    const nearbyText = container.length ? cleanText(container.text().substring(0, 500)) : '';
    const link = $heading.find('a').attr('href') || container.find('a').first().attr('href') || '';
    const fullUrl = link.startsWith('http') ? link : (link.startsWith('/') ? new URL(link, baseUrl).href : baseUrl);

    items.push({
      title,
      company: 'Extracted from page',
      location: 'Not specified',
      description: nearbyText.substring(0, 2000),
      url: fullUrl,
      salary: null,
      tags: [],
    });
  });
  return items;
}

function extractFallback($: cheerio.CheerioAPI, pageUrl: string): ScrapedItem[] {
  const title = cleanText($('title').text());
  const h1 = cleanText($('h1').first().text());
  const metaDesc = cleanText($('meta[name="description"]').attr('content') || '');
  const bodyText = cleanText($('body').text().substring(0, 3000));
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = cleanText($(el).text());
    if (href && text.length > 5 && text.length < 200) {
      links.push(`${text} → ${href}`);
    }
  });

  return [{
    title: h1 || title || pageUrl,
    company: 'Scraped from ' + new URL(pageUrl).hostname,
    location: 'Not specified',
    description: (metaDesc + ' ' + bodyText).substring(0, 2000),
    url: pageUrl,
    salary: null,
    tags: links.slice(0, 20),
  }];
}

const EXTRACTION_METHODS = [
  { name: 'json-ld', fn: extractJsonLd },
  { name: 'microdata', fn: extractMicrodata },
  { name: 'css-selectors', fn: extractBySelectors },
  { name: 'heading-analysis', fn: extractByHeadings },
  { name: 'text-fallback', fn: extractFallback },
];

async function fetchWithStrategy(url: string, strategy: typeof FETCH_STRATEGIES[0]): Promise<string> {
  const response = await fetch(url, {
    headers: strategy.headers as Record<string, string>,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error(`Not HTML content: ${contentType}`);
  }

  return await response.text();
}

async function logHealingEvent(event: Omit<HealingEvent, 'id' | 'timestamp'>): Promise<void> {
  const healingEvent = {
    id: `heal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    await db.from('healing_events').insert({
      id: healingEvent.id,
      collector_id: `custom-${new URL(event.url).hostname}`,
      failure_type: event.phase,
      failed_field: event.strategy,
      previous_record_count: 0,
      failed_record_count: event.errorBefore ? 1 : 0,
      previous_completeness: 0,
      current_completeness: event.success ? 1 : 0,
      healing_status: event.success ? 'recovered' : 'failed',
      started_at: healingEvent.timestamp,
      completed_at: healingEvent.timestamp,
      recovered_record_count: event.success ? event.itemsFound : 0,
      recovery_percentage: event.success ? 100 : 0,
    });
  } catch (err) {
    console.error('[Healing] Failed to log event:', err);
  }
}

export async function scrapeWithSelfHealing(url: string): Promise<SelfHealingResult> {
  let targetUrl = url;
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  const healingEvents: HealingEvent[] = [];
  const attempts: ScrapeAttempt[] = [];
  let hostname: string;
  try {
    hostname = new URL(targetUrl).hostname;
  } catch {
    hostname = 'unknown';
  }

  // Phase 1: Try each fetch strategy
  let html = '';
  let fetchStrategy = '';

  for (const strategy of FETCH_STRATEGIES) {
    const start = Date.now();
    try {
      html = await fetchWithStrategy(targetUrl, strategy);
      fetchStrategy = strategy.name;
      attempts.push({
        method: 'fetch',
        strategy: strategy.name,
        items: [],
        success: true,
        error: null,
        durationMs: Date.now() - start,
      });
      break;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      attempts.push({
        method: 'fetch',
        strategy: strategy.name,
        items: [],
        success: false,
        error: errorMsg,
        durationMs: Date.now() - start,
      });

      await logHealingEvent({
        url: targetUrl,
        phase: 'fetch',
        strategy: strategy.name,
        success: false,
        errorBefore: errorMsg,
        errorAfter: null,
        itemsFound: 0,
      });
    }
  }

  // Phase 2: If all fetch strategies failed, try URL variations
  if (!html) {
    const urlVariations = [
      targetUrl.replace('http://', 'https://'),
      targetUrl.replace('https://', 'http://'),
      targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl + '/',
      targetUrl + '/jobs',
      targetUrl + '/careers',
      targetUrl + '/openings',
    ];

    for (const variant of urlVariations) {
      try {
        html = await fetchWithStrategy(variant, FETCH_STRATEGIES[0]);
        fetchStrategy = `url-variant(${variant})`;

        await logHealingEvent({
          url: targetUrl,
          phase: 'url-variant',
          strategy: variant,
          success: true,
          errorBefore: 'All fetch strategies failed',
          errorAfter: null,
          itemsFound: 0,
        });
        break;
      } catch {
        // continue
      }
    }
  }

  // Phase 3: If still no HTML, we can't proceed
  if (!html) {
    const finalEvent: HealingEvent = {
      id: `heal-${Date.now()}-final-fail`,
      url: targetUrl,
      phase: 'complete-failure',
      strategy: 'all-strategies-exhausted',
      success: false,
      errorBefore: 'Could not fetch URL with any strategy',
      errorAfter: null,
      itemsFound: 0,
      timestamp: new Date().toISOString(),
    };
    healingEvents.push(finalEvent);

    return {
      url: targetUrl,
      pageTitle: targetUrl,
      finalMethod: 'none',
      totalItems: 0,
      attempts,
      healingEvents,
      succeeded: false,
      scrapedAt: new Date().toISOString(),
    };
  }

  // Phase 4: Parse HTML and try extraction methods
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const pageTitle = cleanText($('title').text()) || targetUrl;

  let bestItems: ScrapedItem[] = [];
  let bestMethod = '';

  for (const method of EXTRACTION_METHODS) {
    const start = Date.now();
    try {
      const items = method.fn($, targetUrl);
      attempts.push({
        method: method.name,
        strategy: fetchStrategy,
        items: items.slice(0, 3),
        success: items.length > 0,
        error: items.length === 0 ? 'No items found' : null,
        durationMs: Date.now() - start,
      });

      if (items.length > bestItems.length) {
        bestItems = items;
        bestMethod = method.name;
      }

      if (items.length > 0) {
        await logHealingEvent({
          url: targetUrl,
          phase: 'extraction',
          strategy: method.name,
          success: true,
          errorBefore: '',
          errorAfter: null,
          itemsFound: items.length,
        });
        break;
      }

      await logHealingEvent({
        url: targetUrl,
        phase: 'extraction',
        strategy: method.name,
        success: false,
        errorBefore: 'No items found with this method',
        errorAfter: null,
        itemsFound: 0,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Extraction error';
      attempts.push({
        method: method.name,
        strategy: fetchStrategy,
        items: [],
        success: false,
        error: errorMsg,
        durationMs: Date.now() - start,
      });

      await logHealingEvent({
        url: targetUrl,
        phase: 'extraction',
        strategy: method.name,
        success: false,
        errorBefore: errorMsg,
        errorAfter: null,
        itemsFound: 0,
      });
    }
  }

  // Phase 5: If no extraction method worked but we have HTML, use fallback
  if (bestItems.length === 0) {
    bestItems = extractFallback($, targetUrl);
    bestMethod = 'text-fallback';
  }

  return {
    url: targetUrl,
    pageTitle,
    finalMethod: bestMethod,
    totalItems: bestItems.length,
    attempts,
    healingEvents,
    succeeded: bestItems.length > 0,
    scrapedAt: new Date().toISOString(),
    items: bestItems,
  } as SelfHealingResult & { items: ScrapedItem[] };
}