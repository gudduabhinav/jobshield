'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScraperStatusBadge } from '@/components/dashboard/scraper-status-badge';
import { ScraperHealth, ScraperRun } from '@/types/scraper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, BarChart3, RefreshCw, Loader2, Globe, Shield, Zap, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AttemptInfo {
  method: string;
  strategy: string;
  success: boolean;
  error: string | null;
  durationMs: number;
}

interface HealingInfo {
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

interface ScrapeResult {
  url: string;
  pageTitle: string;
  method: string;
  succeeded: boolean;
  stats: {
    totalFound: number;
    inserted: number;
    skipped: number;
    highRisk: number;
    healingEvents: number;
    strategiesAttempted: number;
    processingTimeMs: number;
  };
  attempts: AttemptInfo[];
  healingEvents: HealingInfo[];
  sample: Array<{ title: string; company: string; location: string }>;
}

interface BrightDataResult {
  message: string;
  url: string;
  collectorId: string;
  succeeded: boolean;
  stats: {
    totalFound: number;
    inserted: number;
    skipped: number;
    highRisk: number;
    healingEvents: number;
    processingTimeMs: number;
  };
  sample: Array<{ title: string; company: string; url: string }>;
}

export default function ScraperHealthPage() {
  const [health, setHealth] = useState<ScraperHealth | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [lastResult, setLastResult] = useState<ScrapeResult | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([
        fetch('/api/scraper/health').then(r => r.json()),
        fetch('/api/scraper/runs').then(r => r.json()),
      ]);
      setHealth(h);
      setRuns(r.runs || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runScrape = async () => {
    if (!customUrl.trim()) return;
    setScraping(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/scraper/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrl.trim() }),
      });
      const data = await res.json();
      setLastResult(data);
      await fetchData();
    } catch (e) {
      setLastResult({
        url: customUrl,
        pageTitle: '',
        method: 'none',
        succeeded: false,
        stats: { totalFound: 0, inserted: 0, skipped: 0, highRisk: 0, healingEvents: 0, strategiesAttempted: 0, processingTimeMs: 0 },
        attempts: [],
        healingEvents: [],
        sample: [],
      });
    } finally {
      setScraping(false);
    }
  };

  const [bdScraping, setBdScraping] = useState(false);
  const [bdResult, setBdResult] = useState<BrightDataResult | null>(null);
  const [bdStatus, setBdStatus] = useState<'idle' | 'triggering' | 'polling' | 'done' | 'failed'>('idle');
  const [healMode, setHealMode] = useState(false);
  const [healDesc, setHealDesc] = useState('');
  const [healing, setHealing] = useState(false);

  const runBrightDataScrape = async () => {
    if (!customUrl.trim()) return;
    setBdScraping(true);
    setBdResult(null);
    setBdStatus('triggering');

    try {
      // Step 1: Trigger
      const triggerRes = await fetch('/api/scraper/brightdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrl.trim() }),
      });
      const triggerData = await triggerRes.json();

      if (!triggerData.success) {
        setBdResult({
          message: triggerData.error || 'Trigger failed',
          url: customUrl,
          collectorId: '',
          succeeded: false,
          stats: { totalFound: 0, inserted: 0, skipped: 0, highRisk: 0, healingEvents: 0, processingTimeMs: 0 },
          sample: [],
        });
        setBdStatus('failed');
        setBdScraping(false);
        return;
      }

      setBdStatus('polling');
      const collectionId = triggerData.collectionId;

      // Step 2: Poll for results
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max

      const poll = async (): Promise<boolean> => {
        if (attempts >= maxAttempts) {
          setBdResult({
            message: 'Timed out waiting for results',
            url: customUrl,
            collectorId: collectionId,
            succeeded: false,
            stats: { totalFound: 0, inserted: 0, skipped: 0, highRisk: 0, healingEvents: 0, processingTimeMs: 0 },
            sample: [],
          });
          setBdStatus('failed');
          return false;
        }

        attempts++;
        await new Promise(r => setTimeout(r, 5000));

        try {
          const pollRes = await fetch(`/api/scraper/brightdata/poll?id=${collectionId}&url=${encodeURIComponent(customUrl.trim())}`);
          const pollData = await pollRes.json();

          if (pollData.status === 'done') {
            setBdResult({
              message: `Scraped ${pollData.totalFound} jobs`,
              url: customUrl,
              collectorId: collectionId,
              succeeded: true,
              stats: {
                totalFound: pollData.totalFound,
                inserted: pollData.inserted,
                skipped: pollData.skipped,
                highRisk: pollData.highRisk,
                healingEvents: 0,
                processingTimeMs: attempts * 5000,
              },
              sample: pollData.sample || [],
            });
            setBdStatus('done');
            await fetchData();
            return true;
          }

          if (pollData.status === 'failed') {
            setBdResult({
              message: pollData.error || 'Scraper failed',
              url: customUrl,
              collectorId: collectionId,
              succeeded: false,
              stats: { totalFound: 0, inserted: 0, skipped: 0, highRisk: 0, healingEvents: 0, processingTimeMs: 0 },
              sample: [],
            });
            setBdStatus('failed');
            return false;
          }

          // Still pending, poll again
          return await poll();
        } catch {
          return await poll();
        }
      };

      await poll();
    } catch (e) {
      setBdResult({
        message: 'Network error',
        url: customUrl,
        collectorId: '',
        succeeded: false,
        stats: { totalFound: 0, inserted: 0, skipped: 0, highRisk: 0, healingEvents: 0, processingTimeMs: 0 },
        sample: [],
      });
      setBdStatus('failed');
    } finally {
      setBdScraping(false);
    }
  };

  const runHeal = async () => {
    if (!healDesc.trim()) return;
    setHealing(true);
    try {
      await fetch('/api/scraper/brightdata/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectorId: process.env.NEXT_PUBLIC_BRIGHT_DATA_COLLECTOR_ID || 'c_mt2zxzmn1hc5ekd0hr',
          description: healDesc.trim(),
          url: customUrl.trim(),
        }),
      });
      setHealDesc('');
      setHealMode(false);
      await fetchData();
    } catch {
      // silent
    } finally {
      setHealing(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Scraper Control</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const fieldEntries = health ? Object.entries(health.fieldCompleteness) : [];
  const statusMessages: Record<string, string> = {
    IDLE: 'Enter a URL above and click Scrape to start collecting data.',
    HEALTHY: 'Scraping is working. Data extraction is performing as expected.',
    DEGRADED: 'The scraper experienced some issues. Some fields may have reduced completeness.',
    FAILED: 'The scraper has failed. Check the URL and try again.',
    HEALING: 'Self-healing is in progress. The system is attempting to recover.',
    RECOVERED: 'The scraper recovered from a failure. Extraction quality is being monitored.',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Scraper Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter any URL — scraper self-heals through multiple strategies
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading || scraping}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* URL Input */}
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Scrape a Public Website
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Paste any URL — the scraper tries multiple fetch strategies and extraction methods, self-healing when one fails.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/jobs"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runScrape()}
              disabled={scraping}
              className="flex-1"
            />
            <Button
              onClick={runScrape}
              disabled={!customUrl.trim() || scraping}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {scraping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Scrape
                </>
              )}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {['builtin.com/jobs', 'remoteok.com', 'wellfound.com', 'ycombinator.com/companies'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setCustomUrl(`https://${suggestion}`)}
                className="text-xs text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bright Data Scraper Studio */}
      <Card className="border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            Bright Data Scraper Studio
            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded ml-auto">
              Collector: c_mt2zxzmn1hc5ekd0hr
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use Bright Data&apos;s AI-powered scraper with self-healing. Powered by Scraper Studio.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={runBrightDataScrape}
              disabled={!customUrl.trim() || bdScraping}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bdStatus === 'triggering' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Triggering scraper...
                </>
              ) : bdStatus === 'polling' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping in progress...
                </>
              ) : bdScraping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Scrape with Bright Data
                </>
              )}
            </Button>
            <Button
              onClick={() => setHealMode(!healMode)}
              variant="outline"
              disabled={bdScraping}
            >
              <Zap className="h-4 w-4 mr-2" />
              Self-Heal
            </Button>
          </div>

          {bdStatus === 'polling' && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 text-blue-400 text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
              Scraper is running... This may take 5-15 minutes. Results will appear automatically.
            </div>
          )}

          {healMode && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Describe what broke (e.g., 'job title field returns null since site redesign')"
                value={healDesc}
                onChange={(e) => setHealDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runHeal()}
                disabled={healing}
                className="flex-1"
              />
              <Button
                onClick={runHeal}
                disabled={!healDesc.trim() || healing}
                variant="destructive"
              >
                {healing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Heal'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bright Data Result */}
      {bdResult && (
        <Card className={bdResult.succeeded ? 'border-blue-500/30' : 'border-red-500/30'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {bdResult.succeeded ? (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {bdResult.succeeded ? 'Bright Data Scrape Succeeded' : 'Bright Data Scrape Failed'}
              <span className="text-xs text-muted-foreground ml-auto">
                {bdResult.stats.processingTimeMs}ms
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{bdResult.stats.totalFound}</div>
                <div className="text-xs text-muted-foreground">Found</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-blue-500">{bdResult.stats.inserted}</div>
                <div className="text-xs text-muted-foreground">Inserted</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-amber-500">{bdResult.stats.healingEvents}</div>
                <div className="text-xs text-muted-foreground">Heal Events</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold font-mono text-xs">{bdResult.collectorId}</div>
                <div className="text-xs text-muted-foreground">Collector ID</div>
              </div>
            </div>
            {bdResult.sample.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sample Extracted</h4>
                <div className="space-y-1">
                  {bdResult.sample.map((item, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.company !== 'Unknown' && <> @ {item.company}</>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scrape Result */}
      {lastResult && (
        <Card className={lastResult.succeeded ? 'border-emerald-500/30' : 'border-red-500/30'}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {lastResult.succeeded ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {lastResult.succeeded ? 'Scrape Succeeded' : 'Scrape Failed'}
              <span className="text-xs text-muted-foreground ml-auto">
                {lastResult.stats.processingTimeMs}ms
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{lastResult.stats.totalFound}</div>
                <div className="text-xs text-muted-foreground">Found</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-emerald-500">{lastResult.stats.inserted}</div>
                <div className="text-xs text-muted-foreground">Inserted</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold text-amber-500">{lastResult.stats.healingEvents}</div>
                <div className="text-xs text-muted-foreground">Heal Events</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-lg font-bold">{lastResult.stats.strategiesAttempted}</div>
                <div className="text-xs text-muted-foreground">Strategies</div>
              </div>
            </div>

            {/* Strategy attempts timeline */}
            {lastResult.attempts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Strategy Attempts
                </h4>
                <div className="space-y-2">
                  {lastResult.attempts.map((attempt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {attempt.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {attempt.method}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {attempt.strategy}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {attempt.durationMs}ms
                      </span>
                      {attempt.error && (
                        <span className="text-xs text-red-400 truncate max-w-[200px]">
                          {attempt.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Healing events */}
            {lastResult.healingEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  Healing Events
                </h4>
                <div className="space-y-1">
                  {lastResult.healingEvents.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {ev.success ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                      <span className="text-muted-foreground">{ev.phase}</span>
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{ev.strategy}</span>
                      {ev.itemsFound > 0 && (
                        <span className="text-emerald-500">{ev.itemsFound} items</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample items */}
            {lastResult.sample.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sample Extracted</h4>
                <div className="space-y-1">
                  {lastResult.sample.map((item, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.company !== 'Unknown' && <> @ {item.company}</>}
                      {item.location !== 'Not specified' && <> · {item.location}</>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ScraperStatusBadge status={health.status} />
                <p className="text-xs text-muted-foreground mt-2">
                  {statusMessages[health.status]}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Scraped</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.totalRecordsExtracted.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Extraction Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.extractionQuality}%</div>
                <Progress value={health.extractionQuality} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Scrapes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runs.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Field-Level Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead className="w-48">Visual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldEntries.map(([field, value]) => {
                    const pct = Math.round((value as number) * 100);
                    return (
                      <TableRow key={field}>
                        <TableCell className="font-medium capitalize">{field}</TableCell>
                        <TableCell>{pct}%</TableCell>
                        <TableCell>
                          <Progress value={pct} className="h-2" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scrape History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No scrape history yet. Enter a URL above to start.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Records</TableHead>
                  <TableHead className="hidden md:table-cell">Quality</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.collectorId}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        run.status === 'completed' ? 'text-emerald-500' : run.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          run.status === 'completed' ? 'bg-emerald-500' : run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{run.recordsFound.toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">{run.extractionQuality}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
