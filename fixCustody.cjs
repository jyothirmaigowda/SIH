const fs = require('fs');
const path = 'app/api/evidence/[evidenceId]/custody/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const { action, place, purpose, notes, toUserId, occurredAt } = body;',
  `const { action, place, purpose, notes, toUserId: inputToUserId, occurredAt } = body;
    let actualToUserId = null;
    if (inputToUserId) {
      const u = await prisma.user.findUnique({ where: { employeeId: inputToUserId } });
      if (!u) return NextResponse.json({ error: 'Transfer target user not found' }, { status: 404 });
      actualToUserId = u.id;
    }`
);

code = code.replace(/toUserId: toUserId \|\| null/g, 'toUserId: actualToUserId');

fs.writeFileSync(path, code);
console.log('Fixed API lookup!');