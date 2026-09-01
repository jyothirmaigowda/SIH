import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { writeAuditEvent } from '@/lib/audit';
import { computeBufferSha256 } from '@/lib/integrity/hash';

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const evidence = await prisma.evidence.findMany({
    where: { caseId },
    include: {
      collectedBy: { select: { name: true, employeeId: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(evidence);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { evidenceRef, type, description, source, collectionPlace, collectedAt } = body;

    if (!evidenceRef || !type || !description || !source || !collectionPlace || !collectedAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collectedAtDate = new Date(collectedAt);

    // Initial custody event hash
    const eventPayload = JSON.stringify({
      evidenceRef,
      action: 'COLLECTED',
      actorId: userId,
      place: collectionPlace,
      occurredAt: collectedAtDate.toISOString()
    });
    const eventHash = computeBufferSha256(Buffer.from(eventPayload));

    const evidence = await prisma.$transaction(async (tx) => {
      const ev = await tx.evidence.create({
        data: {
          evidenceRef,
          caseId,
          type,
          description,
          source,
          collectedById: userId,
          collectedAt: collectedAtDate,
          collectionPlace,
          status: 'COLLECTED'
        }
      });

      await tx.custodyEvent.create({
        data: {
          evidenceId: ev.id,
          actorId: userId,
          toUserId: userId, // currently held by the collector
          action: 'COLLECTED',
          place: collectionPlace,
          purpose: 'Initial Collection',
          notes: 'Registered in SIMS',
          eventHash,
          occurredAt: collectedAtDate
        }
      });

      return ev;
    });

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'EVIDENCE_REGISTERED',
      caseId,
      resourceType: 'Evidence',
      resourceId: evidence.id,
      result: 'SUCCESS',
      metadata: { evidenceRef }
    });

    return NextResponse.json({ success: true, evidenceId: evidence.id });
  } catch (error: any) {
    console.error('Evidence registration error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Evidence reference must be unique' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}