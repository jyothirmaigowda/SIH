const fs = require('fs');
const path = 'app/api/cases/[caseId]/export/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/orderBy: \{ timestamp: 'desc' \}/g, "orderBy: { occurredAt: 'desc' }");
code = code.replace(/log.timestamp.toISOString\(\)/g, "log.occurredAt.toISOString()");
code = code.replace(/log.hash.substring\(0, 40\)/g, "JSON.stringify(log.metadata).substring(0, 40)");
code = code.replace(/return new NextResponse\(pdfBytes,/g, "return new NextResponse(Buffer.from(pdfBytes),");

fs.writeFileSync(path, code);
console.log('Fixed export route TS errors');