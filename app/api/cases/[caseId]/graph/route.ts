
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const nodes = await prisma.graphNode.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
  const edges = await prisma.graphEdge.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });

  return NextResponse.json({ nodes, edges });
}
