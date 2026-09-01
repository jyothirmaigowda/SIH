const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('sims123', 10);

  // Users
  const users = [
    { employeeId: 'IO001', name: 'Officer One', email: 'io1@sims.local', role: 'IO' },
    { employeeId: 'SUP001', name: 'Supervisor One', email: 'sup1@sims.local', role: 'SUPERVISOR' },
    { employeeId: 'LEG001', name: 'Legal One', email: 'leg1@sims.local', role: 'LEGAL' },
    { employeeId: 'CFG001', name: 'Config Admin', email: 'cfg1@sims.local', role: 'CONFIG' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { employeeId: u.employeeId },
      update: {},
      create: {
        employeeId: u.employeeId,
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash,
        active: true
      }
    });
  }

  console.log('Seeded users:', users.map(u => u.employeeId).join(', '));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });