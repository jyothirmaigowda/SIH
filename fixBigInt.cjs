const fs = require('fs');
const path = 'app/api/cases/[caseId]/documents/route.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace('return NextResponse.json(documents);', `
  const serialized = documents.map(doc => ({
    ...doc,
    versions: doc.versions.map(v => ({
      ...v,
      sizeBytes: v.sizeBytes.toString()
    }))
  }));
  return NextResponse.json(serialized);
`);
fs.writeFileSync(path, code);
console.log('Fixed BigInt!');