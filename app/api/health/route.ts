import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    const health = await serverDb.healthCheck();
    
    return NextResponse.json({
      success: true,
      data: health,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
}
