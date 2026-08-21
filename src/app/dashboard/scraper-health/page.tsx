'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScraperStatusBadge } from '@/components/dashboard/scraper-status-badge';
import { ScraperHealth, ScraperRun } from '@/types/scraper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, BarChart3, RefreshCw, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ScraperHealthPage() {
  const [health, setHealth] = useState<ScraperHealth | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

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
      if (res.ok) {
        setLastResult(`Found ${data.stats.totalFound} items from ${data.pageTitle} using ${data.method}. Inserted ${data.stats.inserted}. High risk: ${data.stats.highRisk}`);
        await fetchData();
      } else {
        setLastResult(`Error: ${data.error} — ${data.details || ''}`);
      }
    } catch (e) {
      setLastResult(`Network error: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setScraping(false);
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
            Enter any public URL to scrape and extract data
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
            Paste any public URL — the scraper fetches the page, extracts content, scores risk, and stores results in the database.
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
                  <Globe className="h-4 w-4 mr-2" />
                  Scrape
                </>
              )}
            </Button>
          </div>
          {lastResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${lastResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {lastResult}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {['builtin.com/jobs', 'remoteok.com', 'arbeitnow.com', 'wellfound.com'].map(suggestion => (
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