import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    BRIGHT_DATA_API_KEY: process.env.BRIGHT_DATA_API_KEY ? 'SET' : 'NOT SET',
    BRIGHT_DATA_COLLECTOR_ID: process.env.BRIGHT_DATA_COLLECTOR_ID || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  });
}
