import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { writeAuditEvent } from '@/lib/audit';
import { computeBufferSha256 } from '@/lib/integrity/hash';

export async function GET(request: NextRequest, { params }: { params: Promise<{ evidenceId: string }> }) {
  const { evidenceId } = await params;
  const userId = request.headers.get('x-sims-user-id');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkCaseAccess(userId, evidence.caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const events = await prisma.custodyEvent.findMany({
    where: { evidenceId },
    include: {
      actor: { select: { name: true, employeeId: true } },
      fromUser: { select: { name: true, employeeId: true } },
      toUser: { select: { name: true, employeeId: true } },
    },
    orderBy: { occurredAt: 'asc' }
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ evidenceId: string }> }) {
  const { evidenceId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const evidence = await prisma.evidence.findUnique({ 
    where: { id: evidenceId },
    include: { custodyEvents: { orderBy: { occurredAt: 'desc' }, take: 1 } }
  });
  if (!evidence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkCaseAccess(userId, evidence.caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, place, purpose, notes, toUserId: inputToUserId, occurredAt } = body;
    let actualToUserId = null;
    if (inputToUserId) {
      const u = await prisma.user.findUnique({ where: { employeeId: inputToUserId } });
      if (!u) return NextResponse.json({ error: 'Transfer target user not found' }, { status: 404 });
      actualToUserId = u.id;
    }

    if (!action || !place || !purpose || !occurredAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const occurredAtDate = new Date(occurredAt);
    const lastEvent = evidence.custodyEvents[0];
    const fromUserId = lastEvent?.toUserId || null; // The person who currently has it

    const eventPayload = JSON.stringify({
      evidenceId,
      action,
      actorId: userId,
      fromUserId,
      toUserId: actualToUserId,
      place,
      occurredAt: occurredAtDate.toISOString()
    });
    const eventHash = computeBufferSha256(Buffer.from(eventPayload));

    await prisma.$transaction(async (tx) => {
      await tx.custodyEvent.create({
        data: {
          evidenceId,
          actorId: userId,
          fromUserId,
          toUserId: actualToUserId,
          action,
          place,
          purpose,
          notes,
          eventHash,
          occurredAt: occurredAtDate
        }
      });

      await tx.evidence.update({
        where: { id: evidenceId },
        data: { status: action } // Status derived from latest action
      });
    });

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CUSTODY_UPDATED',
      caseId: evidence.caseId,
      resourceType: 'Evidence',
      resourceId: evidence.id,
      result: 'SUCCESS',
      metadata: { action, eventHash }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Custody update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}