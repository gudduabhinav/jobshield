import { NextResponse } from 'next/server';
import { fetchCompanies } from '@/lib/db';

export async function GET() {
  try {
    const companies = await fetchCompanies();
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('[API /companies] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
