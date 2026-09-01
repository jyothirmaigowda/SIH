const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const enums = [
  'UserRole', 'CaseStatus', 'CasePriority', 'CaseAssignmentRole', 'PersonCategory',
  'DocumentStatus', 'DocumentType', 'EvidenceType', 'EvidenceStatus', 'CustodyAction',
  'ReportType', 'ReportStatus', 'ReviewDecision', 'NotificationType', 'AuditAction',
  'AuditResult', 'DiaryEntryStatus', 'CertificateStatus'
];

schema = schema.replace(/enum\s+[A-Za-z0-9_]+\s+\{[\s\S]*?\}/g, '');

for (const e of enums) {
  const re = new RegExp('\\b' + e + '\\b', 'g');
  schema = schema.replace(re, 'String');
}

schema = schema.replace(/@default\(([A-Z_]+)\)/g, '@default("$1")');
schema = schema.replace(/String\[\]/g, 'String');

// Fix JSON fields for SQLite (change JSONB to String since Prisma SQLite only supports String, Int, Boolean, etc.)
// Actually Prisma doesn't support Json in SQLite. We must change Json/JSONB to String.
schema = schema.replace(/JSONB/g, 'String');
schema = schema.replace(/@default\({}\)/g, '@default("{}")');

schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "file:./dev.db"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/, ''); // in case of duplicate

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Fixed schema for SQLite!');