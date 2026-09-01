import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { getStoragePath } from '@/lib/storage';
import { writeAuditEvent } from '@/lib/audit';
import fs from 'fs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const versionParam = url.searchParams.get('v');

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      versions: versionParam 
        ? { where: { versionNumber: parseInt(versionParam) } } 
        : { orderBy: { versionNumber: 'desc' }, take: 1 }
    }
  });

  if (!document || document.versions.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const access = await checkCaseAccess(userId, document.caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const targetVersion = document.versions[0];

  try {
    const absolutePath = getStoragePath(targetVersion.storageKey);
    const fileBuffer = fs.readFileSync(absolutePath);

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'DOCUMENT_DOWNLOADED',
      caseId: document.caseId,
      resourceType: 'Document',
      resourceId: document.id,
      result: 'SUCCESS',
      metadata: { version: targetVersion.versionNumber, hash: targetVersion.sha256Hash }
    });

    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': targetVersion.mimeType,
        'Content-Disposition': `attachment; filename="${targetVersion.originalFilename}"`,
        'Content-Length': targetVersion.sizeBytes.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}