import { NextResponse } from 'next/server';
import { fetchHealingEvents } from '@/lib/db';

export async function GET() {
  try {
    const events = await fetchHealingEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error('[API /healing-events] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch healing events' }, { status: 500 });
  }
}
