import { NextRequest, NextResponse } from 'next/server';
import { getDemoJobs } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const jobs = getDemoJobs();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const riskLevel = searchParams.get('risk') || '';
    const location = searchParams.get('location') || '';
    const source = searchParams.get('source') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const sort = searchParams.get('sort') || 'riskScore';
    const order = searchParams.get('order') || 'desc';

    let filtered = [...jobs];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
      );
    }

    if (riskLevel) {
      filtered = filtered.filter(j => j.riskLevel === riskLevel);
    }

    if (location) {
      const loc = location.toLowerCase();
      filtered = filtered.filter(j => j.location.toLowerCase().includes(loc));
    }

    if (source) {
      const src = source.toLowerCase();
      filtered = filtered.filter(j => j.sourceName.toLowerCase().includes(src));
    }

    const validSortKeys = ['riskScore', 'title', 'companyName', 'postedDate', 'scrapedAt'] as const;
    const sortKey = validSortKeys.includes(sort as typeof validSortKeys[number]) ? sort : 'riskScore';

    filtered.sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a] ?? '';
      const bVal = b[sortKey as keyof typeof b] ?? '';
      if (sortKey === 'riskScore') {
        return order === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return order === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
      jobs: paginated,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[API /jobs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
