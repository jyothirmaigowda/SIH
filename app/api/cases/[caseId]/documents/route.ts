import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, validateMagicBytes, generateStorageKey, writeToStorage } from '@/lib/storage';
import { computeFileSha256 } from '@/lib/integrity/hash';
import { writeAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const documents = await prisma.document.findMany({
    where: { caseId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: { uploadedBy: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const serialized = documents.map(doc => ({
    ...doc,
    versions: doc.versions.map(v => ({
      ...v,
      sizeBytes: v.sizeBytes.toString()
    }))
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;

    if (!file || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      return NextResponse.json({ error: 'File integrity check failed' }, { status: 400 });
    }

    const extension = file.name.split('.').pop() || 'bin';
    const storageKey = generateStorageKey(caseId, extension);
    
    const absolutePath = await writeToStorage(storageKey, buffer);
    const sha256Hash = await computeFileSha256(absolutePath);

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: { caseId, type, description, status: 'ACTIVE' }
      });
      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          originalFilename: file.name,
          storageKey,
          mimeType: file.type,
          sizeBytes: BigInt(file.size),
          sha256Hash,
          uploadedById: userId
        }
      });
      return doc;
    });

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'DOCUMENT_UPLOADED',
      caseId,
      resourceType: 'Document',
      resourceId: document.id,
      result: 'SUCCESS',
      metadata: { filename: file.name, hash: sha256Hash, version: 1 }
    });

    return NextResponse.json({ success: true, documentId: document.id });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}