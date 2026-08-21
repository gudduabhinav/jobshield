'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { ScraperStatusBadge } from '@/components/dashboard/scraper-status-badge';
import { DashboardStats } from '@/types/scraper';
import { Briefcase, Shield, AlertTriangle, Activity, HeartPulse, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

interface PieLabelProps {
  name?: string;
  value?: number;
}

function PieLabel({ name, value }: PieLabelProps) {
  return `${name || ''}: ${value || 0}`;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/dashboard/stats');
      const data = await r.json();
      setStats(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStats().then(async (data) => {
      if (data && data.totalJobs === 0) {
        setScraping(true);
        setScrapeMessage('No jobs found — scraping live data from web sources...');
        try {
          const res = await fetch('/api/scraper/run', { method: 'POST' });
          const result = await res.json();
          if (res.ok) {
            setScrapeMessage(`Scraped ${result.stats.inserted} real jobs from ${Object.keys(result.stats.bySource).length} sources`);
            await fetchStats();
          } else {
            setScrapeMessage('Scrape failed — go to Scraper Health to run manually');
          }
        } catch {
          setScrapeMessage('Could not reach scraper — check if server is running');
        } finally {
          setScraping(false);
        }
      }
    });
  }, [fetchStats]);

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time job intelligence from live sources
          </p>
        </div>
        <ScraperStatusBadge status={stats.scraperStatus} />
      </div>

      {(scraping || scrapeMessage) && (
        <Card className={scrapeMessage?.includes('Scraped') ? 'border-emerald-500/50' : scrapeMessage?.includes('fail') || scrapeMessage?.includes('Could not') ? 'border-red-500/50' : 'border-amber-500/50'}>
          <CardContent className="py-3 flex items-center gap-3">
            {scraping && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
            <p className={`text-sm ${
              scrapeMessage?.includes('Scraped') ? 'text-emerald-400' :
              scrapeMessage?.includes('fail') || scrapeMessage?.includes('Could not') ? 'text-red-400' :
              'text-amber-400'
            }`}>
              {scrapeMessage}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs.toLocaleString()}
          icon={Briefcase}
          description="Jobs collected and analyzed"
        />
        <StatCard
          title="Low Risk"
          value={stats.lowRisk.toLocaleString()}
          icon={CheckCircle}
          description="Jobs with clean signals"
          iconClassName="text-emerald-500"
        />
        <StatCard
          title="Needs Verification"
          value={stats.mediumRisk.toLocaleString()}
          icon={AlertTriangle}
          description="Jobs with some concerns"
          iconClassName="text-amber-500"
        />
        <StatCard
          title="High Risk Signals"
          value={stats.highRisk.toLocaleString()}
          icon={Shield}
          description="Jobs with strong risk signals"
          iconClassName="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Last Successful Run"
          value={stats.lastSuccessfulRun ? new Date(stats.lastSuccessfulRun).toLocaleTimeString() : 'N/A'}
          icon={Activity}
          description="Live scraper"
        />
        <StatCard
          title="Healing Events"
          value={stats.healingEvents}
          icon={HeartPulse}
          description="Self-healing recoveries"
        />
        <StatCard
          title="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          icon={CheckCircle}
          description="Successful recoveries"
          iconClassName="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs Collected Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.jobsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="level"
                  label={PieLabel}
                >
                  {stats.riskDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scraper Extraction Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.extractionQuality}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}