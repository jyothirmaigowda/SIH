import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({});
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  
  if (!session.userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      employeeId: session.employeeId,
      name: session.name,
      role: session.role
    }
  });
}