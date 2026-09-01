import { NextRequest, NextResponse } from 'next/server';

// Phase 8 will implement this endpoint.
// Stub — returns 501 Not Implemented until that phase completes.

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented', phase: 8 }, { status: 501 });
}
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented', phase: 8 }, { status: 501 });
}
export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: 'Not implemented', phase: 8 }, { status: 501 });
}