const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
schema = schema.replace(/url = env\("DATABASE_URL"\)\s*/g, '');
schema = schema.replace(/provider = "sqlite"/, 'provider = "sqlite"\n  url = env("DATABASE_URL")');
fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Fixed schema datasource url');