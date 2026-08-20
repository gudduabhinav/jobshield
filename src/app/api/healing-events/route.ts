import { NextResponse } from 'next/server';
import { getDemoHealingEvents } from '@/lib/demo-data';

export async function GET() {
  try {
    const events = getDemoHealingEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error('[API /healing-events] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch healing events' }, { status: 500 });
  }
}
