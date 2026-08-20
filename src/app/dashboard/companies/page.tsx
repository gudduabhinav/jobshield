'use client';

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { RiskLevel } from '@/types/jobs';
import { Building2 } from 'lucide-react';

interface Company {
  name: string;
  jobCount: number;
  avgRisk: number;
  locations: string[];
  riskLevel: RiskLevel;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => { setCompanies(data.companies || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          Companies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated company data from collected job listings
        </p>
      </div>

      <div className="border border-border/50 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="hidden md:table-cell">Locations</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Avg Risk</TableHead>
              <TableHead className="hidden md:table-cell">Risk Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.name}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {company.locations.slice(0, 2).join(', ')}
                    {company.locations.length > 2 && ` +${company.locations.length - 2}`}
                  </TableCell>
                  <TableCell>{company.jobCount}</TableCell>
                  <TableCell>{company.avgRisk}/100</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <RiskBadge level={company.riskLevel} score={company.avgRisk} showScore={false} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
