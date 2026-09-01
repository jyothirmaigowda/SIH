const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.documentVersion.deleteMany({});
  await prisma.document.deleteMany({});
  console.log('Cleaned documents');
}
clean().catch(console.error).finally(() => prisma.$disconnect());