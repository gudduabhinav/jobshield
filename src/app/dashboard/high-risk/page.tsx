'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { JobRecord } from '@/types/jobs';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function HighRiskPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs/high-risk')
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          High Risk Jobs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Job listings with the strongest risk signals. Scores are automated, not definitive fraud determinations.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No high-risk jobs detected
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="border-red-500/20 hover:border-red-500/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold hover:text-emerald-500 transition-colors">
                      {job.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.companyName || 'Unknown Company'} &middot; {job.location}
                    </p>
                    {job.riskReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.riskReasons.map((r) => (
                          <Badge key={r.ruleId} variant="outline" className="text-xs bg-red-500/5 text-red-500 border-red-500/20">
                            +{r.weight} {r.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={job.riskLevel} score={job.riskScore} />
                    <Link href={`/dashboard/jobs/${job.id}`} className="text-muted-foreground hover:text-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
