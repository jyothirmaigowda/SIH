const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const exportDir = 'app/api/cases/[caseId]/export';
ensureDir(exportDir);

fs.writeFileSync(path.join(exportDir, 'route.ts'), `
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkCaseAccess } from '@/lib/auth/authorization';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { writeAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const userId = request.headers.get('x-sims-user-id');
  const userRole = request.headers.get('x-sims-user-role') || '';

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await checkCaseAccess(userId, caseId);
  if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        evidence: true,
      }
    });
    if (!caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    const auditLogs = await prisma.auditLog.findMany({
      where: { caseId },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([600, 800]);
    let y = 750;

    const drawText = (text: string, size = 12, isBold = false) => {
      if (y < 50) return; // simple overflow prevention for this PoC
      page.drawText(text.substring(0, 80), {
        x: 50,
        y,
        size,
        font: isBold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
      y -= (size + 8);
    };

    drawText(\`OFFICIAL CASE DIARY\`, 20, true);
    y -= 10;
    drawText(\`Case Number: \${caseData.caseNumber}\`, 14);
    drawText(\`Title: \${caseData.title}\`);
    drawText(\`Status: \${caseData.status}\`);
    drawText(\`Generated At: \${new Date().toISOString()}\`);
    y -= 20;

    drawText(\`EVIDENCE REGISTRY (\${caseData.evidence.length} items)\`, 16, true);
    y -= 10;
    caseData.evidence.forEach(ev => {
      drawText(\`- \${ev.evidenceRef}: \${ev.description} [\${ev.status}]\`);
    });
    y -= 20;

    drawText(\`RECENT AUDIT LOGS (Immutable Trail)\`, 16, true);
    y -= 10;
    auditLogs.forEach(log => {
      drawText(\`[\${log.timestamp.toISOString()}] \${log.action} by \${log.actorId}\`, 10);
      drawText(\`  Hash: \${log.hash.substring(0, 40)}...\`, 8);
    });

    const pdfBytes = await pdfDoc.save();

    await writeAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CASE_EXPORTED',
      caseId,
      resourceType: 'Case',
      resourceId: caseId,
      result: 'SUCCESS',
      metadata: { format: 'PDF', evidenceCount: caseData.evidence.length }
    });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': \`attachment; filename="Case_\${caseData.caseNumber}_Diary.pdf"\`,
      },
    });
  } catch (error) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF export' }, { status: 500 });
  }
}
`);
console.log('PDF export route created');