import { NextRequest, NextResponse } from 'next/server';
import { fetchJobs } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const risk = searchParams.get('risk') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const sort = searchParams.get('sort') || 'risk_score';
    const order = searchParams.get('order') || 'desc';

    const result = await fetchJobs({ search, risk, page, limit, sort, order });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /jobs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
