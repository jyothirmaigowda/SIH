const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const io = await prisma.user.findUnique({ where: { employeeId: 'IO001' } });
  if (!io) throw new Error('IO001 not found');

  const station = await prisma.policeOrganisation.upsert({
    where: { id: 'STATION-01' },
    update: {},
    create: {
      id: 'STATION-01',
      name: 'Central Police Station',
      level: 'STATION'
    }
  });

  const testCase = await prisma.case.upsert({
    where: { id: 'CASE-001' },
    update: {},
    create: {
      id: 'CASE-001',
      caseNumber: 'CR-2026-001',
      title: 'Test Investigation',
      type: 'CRIMINAL',
      offenceSections: 'IPC 420',
      status: 'REGISTERED',
      priority: 'NORMAL',
      stationId: station.id
    }
  });

  await prisma.caseAssignment.upsert({
    where: {
      caseId_userId_role: {
        caseId: 'CASE-001',
        userId: io.id,
        role: 'IO'
      }
    },
    update: {},
    create: {
      caseId: 'CASE-001',
      userId: io.id,
      role: 'IO',
      assignedById: io.id,
      assignedAt: new Date(),
      active: true
    }
  });

  console.log('Seeded test case CASE-001 and assigned to IO001');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });