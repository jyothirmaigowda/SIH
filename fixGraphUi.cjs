const fs = require('fs');
const path = 'app/(protected)/cases/[caseId]/graph/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/<select value=\{nodeForm.nodeType\}/g, '<select id="nodeType" value={nodeForm.nodeType}');
code = code.replace(/<select required value=\{edgeForm.fromNodeId\}/g, '<select id="fromNodeId" required value={edgeForm.fromNodeId}');
code = code.replace(/<select value=\{edgeForm.relationship\}/g, '<select id="relationship" value={edgeForm.relationship}');
code = code.replace(/<select required value=\{edgeForm.toNodeId\}/g, '<select id="toNodeId" required value={edgeForm.toNodeId}');

fs.writeFileSync(path, code);
console.log("Added IDs to select dropdowns");