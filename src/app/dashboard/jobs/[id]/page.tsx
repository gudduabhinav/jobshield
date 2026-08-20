'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { JobRecord } from '@/types/jobs';
import { ArrowLeft, ExternalLink, Building2, MapPin, DollarSign, Calendar, Briefcase, Globe, Tag } from 'lucide-react';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.json())
      .then(data => { setJob(data.job); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/dashboard/jobs" className="text-emerald-500 text-sm mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{job.companyName || 'Unknown Company'}</span>
            {job.companyUrl && (
              <a href={job.companyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
            {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>}
            {job.employmentType && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.employmentType}</span>}
          </div>
        </div>
        <RiskBadge level={job.riskLevel} score={job.riskScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Posted Date</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Unknown'}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Source</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{job.sourceName}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remote Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{job.remoteStatus || 'Not specified'}</span>
          </CardContent>
        </Card>
      </div>

      {job.riskReasons.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Risk Assessment: {job.riskScore}/100
              <RiskBadge level={job.riskLevel} score={job.riskScore} showScore={false} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Why this score? Here are the signals detected:
            </p>
            <div className="space-y-2">
              {job.riskReasons.map((reason) => (
                <div key={reason.ruleId} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-mono font-bold text-red-500 mt-0.5">+{reason.weight}</div>
                  <div>
                    <div className="text-sm font-medium">{reason.name}</div>
                    <div className="text-xs text-muted-foreground">{reason.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {job.duplicateGroupId && (
        <Card className="border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">
                {job.isReposted ? 'REPOSTED' : 'POSSIBLE DUPLICATE'}
              </span>
              <span className="text-xs text-muted-foreground">
                — This listing appears to be {job.isReposted ? 'a repost' : 'a duplicate'} of another listing
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {job.description}
          </p>
        </CardContent>
      </Card>

      {job.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors inline-flex items-center gap-2"
        >
          Apply <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {job.sourceUrl && (
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors inline-flex items-center gap-2"
          >
            View Source <Globe className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="text-xs text-muted-foreground border-t border-border/50 pt-4">
        Scraped at: {new Date(job.scrapedAt).toLocaleString()}
        {job.companyUrl && <> | Company: {job.companyUrl}</>}
        <br />
        Disclaimer: This risk assessment is automated and not a definitive determination of fraud.
      </div>
    </div>
  );
}
