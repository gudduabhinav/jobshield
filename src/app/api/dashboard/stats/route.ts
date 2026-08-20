import { NextResponse } from 'next/server';
import { fetchDashboardStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await fetchDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API /dashboard/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
