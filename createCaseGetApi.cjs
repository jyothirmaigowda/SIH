const fs = require('fs');
const path = require('path');
const apiDir = 'app/api/cases/[caseId]';
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

fs.writeFileSync(path.join(apiDir, 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId }
    });
    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    return NextResponse.json(caseData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`);
console.log('Case GET route created');