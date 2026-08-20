import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/demo-data';

export async function GET() {
  try {
    const stats = getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API /dashboard/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
