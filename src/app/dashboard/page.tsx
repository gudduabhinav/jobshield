'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { ScraperStatusBadge } from '@/components/dashboard/scraper-status-badge';
import { DashboardStats } from '@/types/scraper';
import { Briefcase, Shield, AlertTriangle, Activity, HeartPulse, CheckCircle, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
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

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

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

  if (stats.totalJobs === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time job intelligence from live scraping
          </p>
        </div>
        <Card className="py-16">
          <CardContent className="text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No data yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Go to the scraper and enter a public URL to start collecting data.
            </p>
            <Link
              href="/dashboard/scraper-health"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Open Scraper
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data from live scraping sessions
          </p>
        </div>
        <ScraperStatusBadge status={stats.scraperStatus} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={stats.totalJobs.toLocaleString()}
          icon={Briefcase}
          description="Items scraped and analyzed"
        />
        <StatCard
          title="Low Risk"
          value={stats.lowRisk.toLocaleString()}
          icon={CheckCircle}
          description="Clean signals"
          iconClassName="text-emerald-500"
        />
        <StatCard
          title="Needs Verification"
          value={stats.mediumRisk.toLocaleString()}
          icon={AlertTriangle}
          description="Some concerns"
          iconClassName="text-amber-500"
        />
        <StatCard
          title="High Risk"
          value={stats.highRisk.toLocaleString()}
          icon={Shield}
          description="Strong risk signals"
          iconClassName="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Last Scrape"
          value={stats.lastSuccessfulRun ? new Date(stats.lastSuccessfulRun).toLocaleTimeString() : 'N/A'}
          icon={Activity}
          description="Most recent scrape"
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
            <CardTitle className="text-base">Items Collected</CardTitle>
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
          <CardTitle className="text-base">Extraction Quality</CardTitle>
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