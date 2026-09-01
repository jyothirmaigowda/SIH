const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. GET /api/cases/[caseId]/graph/route.ts
const graphDir = 'app/api/cases/[caseId]/graph';
ensureDir(graphDir);
fs.writeFileSync(path.join(graphDir, 'route.ts'), `
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
`);

// 2. POST /api/cases/[caseId]/graph/nodes/route.ts
const nodesDir = 'app/api/cases/[caseId]/graph/nodes';
ensureDir(nodesDir);
fs.writeFileSync(path.join(nodesDir, 'route.ts'), `
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
`);

// 3. POST /api/cases/[caseId]/graph/edges/route.ts
const edgesDir = 'app/api/cases/[caseId]/graph/edges';
ensureDir(edgesDir);
fs.writeFileSync(path.join(edgesDir, 'route.ts'), `
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
    const { fromNodeId, toNodeId, relationship } = await request.json();
    if (!fromNodeId || !toNodeId || !relationship) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const edge = await prisma.graphEdge.create({
      data: { caseId, fromNodeId, toNodeId, relationship }
    });

    return NextResponse.json({ success: true, edge });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`);
console.log('Graph API routes created');