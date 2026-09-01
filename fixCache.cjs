const fs = require('fs');
const path = 'app/api/documents/[documentId]/download/route.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  "'Content-Length': targetVersion.sizeBytes.toString(),", 
  "'Content-Length': targetVersion.sizeBytes.toString(),\n        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',"
);
fs.writeFileSync(path, code);
console.log('Fixed Cache-Control header!');