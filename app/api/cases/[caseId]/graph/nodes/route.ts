
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { label, nodeType } = await request.json();
    if (!label || !nodeType) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const node = await prisma.graphNode.create({
      data: { caseId, label, nodeType }
    });

    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
