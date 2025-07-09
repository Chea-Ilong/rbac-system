import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real app, you'd verify JWT token or session here
    // For now, just return unauthorized
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
