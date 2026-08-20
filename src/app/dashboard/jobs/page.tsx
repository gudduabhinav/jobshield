'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { JobRecord } from '@/types/jobs';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface JobsResponse {
  jobs: JobRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function JobsPage() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (search) params.set('search', search);
    if (risk) params.set('risk', risk);
    try {
      const res = await fetch(`/api/jobs?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      // fetch failed
    }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [page, risk]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchJobs(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and filter all collected job listings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies, descriptions..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select value={risk || 'all'} onValueChange={(v) => { setRisk(v === 'all' ? '' : (v ?? '')); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Risk Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="LOW">Low Risk</SelectItem>
            <SelectItem value="MEDIUM">Needs Verification</SelectItem>
            <SelectItem value="HIGH">High Risk</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="secondary">Search</Button>
      </div>

      <div className="border border-border/50 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Posted</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : data?.jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              data?.jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-medium hover:text-emerald-500 transition-colors">
                      {job.title}
                    </Link>
                    <div className="text-xs text-muted-foreground md:hidden mt-1">{job.companyName}</div>
                    {job.isReposted && (
                      <Badge variant="outline" className="text-xs mt-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                        REPOSTED
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{job.companyName || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{job.location}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={job.riskLevel} score={job.riskScore} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{job.sourceName}</TableCell>
                  <TableCell>
                    <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} jobs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
