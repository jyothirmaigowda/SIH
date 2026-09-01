import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { writeAuditEvent } from '@/lib/audit';


export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.redirect(new URL('/login', request.url));
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    if (session.userId) {
      await writeAuditEvent({
        actorId: session.userId,
        actorRole: session.role,
        action: 'USER_LOGOUT',
        result: 'SUCCESS',
        metadata: { employeeId: session.employeeId }
      });
    }

    session.destroy();
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, redirect: '/login' });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    if (session.userId) {
      await writeAuditEvent({
        actorId: session.userId,
        actorRole: session.role,
        action: 'USER_LOGOUT',
        result: 'SUCCESS',
        metadata: { employeeId: session.employeeId }
      });
    }

    session.destroy();
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}