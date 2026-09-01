import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, validateMagicBytes, generateStorageKey, writeToStorage } from '@/lib/storage';
import { computeFileSha256 } from '@/lib/integrity/hash';
import { writeAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
  });

  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const access = await checkCaseAccess(userId, document.caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: 'File integrity check failed (magic bytes mismatch)' }, { status: 400 });
    }

    const extension = file.name.split('.').pop() || 'bin';
    const storageKey = generateStorageKey(document.caseId, extension);
    
    const absolutePath = await writeToStorage(storageKey, buffer);
    const sha256Hash = await computeFileSha256(absolutePath);

    const nextVersion = (document.versions[0]?.versionNumber || 0) + 1;

    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: nextVersion,
        originalFilename: file.name,
        storageKey,
        mimeType: file.type,
        sizeBytes: BigInt(file.size),
        sha256Hash,
        uploadedById: userId
      }
    });

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'DOCUMENT_UPLOADED',
      caseId: document.caseId,
      resourceType: 'Document',
      resourceId: document.id,
      result: 'SUCCESS',
      metadata: { filename: file.name, hash: sha256Hash, version: nextVersion }
    });

    return NextResponse.json({ success: true, version: nextVersion });
  } catch (error) {
    console.error('Document version upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}