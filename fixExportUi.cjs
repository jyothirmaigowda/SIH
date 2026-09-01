const fs = require('fs');
const path = 'app/(protected)/cases/[caseId]/overview/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("a.download = `Case_Diary.pdf`;", "a.download = `Case_${caseData.caseNumber}_Diary.pdf`;");

fs.writeFileSync(path, code);
console.log('Fixed download filename in UI');