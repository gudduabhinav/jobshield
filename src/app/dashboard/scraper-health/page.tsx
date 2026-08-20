'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScraperStatusBadge } from '@/components/dashboard/scraper-status-badge';
import { ScraperHealth, ScraperRun } from '@/types/scraper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, BarChart3, Play, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScraperHealthPage() {
  const [health, setHealth] = useState<ScraperHealth | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [loading, setLoading] = useState(true);
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

  const runScraper = async () => {
    setScraping(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/scraper/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastResult(`Scraped ${data.stats.totalFetched} jobs, inserted ${data.stats.inserted} (High: ${data.stats.riskBreakdown.high}, Medium: ${data.stats.riskBreakdown.medium}, Low: ${data.stats.riskBreakdown.low})`);
        await fetchData();
      } else {
        setLastResult(`Error: ${data.error || 'Unknown error'}`);
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
        <h1 className="text-2xl font-bold">Scraper Health</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const fieldEntries = health ? Object.entries(health.fieldCompleteness) : [];
  const statusMessages: Record<string, string> = {
    IDLE: 'Scraper has not run yet. Click "Run Live Scraper" to fetch real job data.',
    HEALTHY: 'The collector is operating normally. Data extraction is performing as expected.',
    DEGRADED: 'The collector is experiencing some issues. Some fields may have reduced completeness.',
    FAILED: 'The collector has failed. Data extraction is not producing valid results.',
    HEALING: 'Self-healing is in progress. The system is attempting to recover.',
    RECOVERED: 'The collector has recovered from a failure. Extraction quality is being monitored.',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Scraper Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor live data collection and extraction quality
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading || scraping}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={runScraper}
            size="sm"
            disabled={scraping}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {scraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Live Scraper
              </>
            )}
          </Button>
        </div>
      </div>

      {lastResult && (
        <Card className={lastResult.startsWith('Error') || lastResult.startsWith('Network') ? 'border-red-500/50' : 'border-emerald-500/50'}>
          <CardContent className="py-3">
            <p className={`text-sm ${lastResult.startsWith('Error') || lastResult.startsWith('Network') ? 'text-red-400' : 'text-emerald-400'}`}>
              {lastResult}
            </p>
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
                <CardTitle className="text-sm text-muted-foreground">Records</CardTitle>
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
                <CardTitle className="text-sm text-muted-foreground">Last Run</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {health.lastSuccessfulRun
                    ? `${Math.round((Date.now() - new Date(health.lastSuccessfulRun).getTime()) / 60000)} minutes ago`
                    : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Recovery Rate: {health.recoveryRate}%
                </div>
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
            Recent Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No runs yet. Click &quot;Run Live Scraper&quot; to fetch real job data from live sources.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Records</TableHead>
                  <TableHead className="hidden md:table-cell">Quality</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.id}</TableCell>
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