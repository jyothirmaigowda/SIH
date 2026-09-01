import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { writeAuditEvent } from '@/lib/audit';

const loginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? '5');
const LOCKOUT_MINUTES = parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? '15');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
    }

    const { employeeId, password } = result.data;

    const user = await prisma.user.findUnique({ where: { employeeId } });

    if (!user || !user.active) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Please try again later.' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil }
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset failed attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      });
    }

    // Create session
    const response = NextResponse.json({ success: true, redirect: '/dashboard' });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    const now = Date.now();
    session.userId = user.id;
    session.employeeId = user.employeeId;
    session.role = user.role;
    session.name = user.name;
    session.sessionCreatedAt = now;
    session.lastActivityAt = now;
    await session.save();

    await writeAuditEvent({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      result: 'SUCCESS',
      metadata: { employeeId: user.employeeId }
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}