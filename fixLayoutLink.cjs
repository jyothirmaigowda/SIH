const fs = require('fs');
const path = 'app/(protected)/layout.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('<Link href="/api/auth/logout"', '<a href="/api/auth/logout"');
code = code.replace('Sign Out\n          </Link>', 'Sign Out\n          </a>');

fs.writeFileSync(path, code);
console.log('Fixed layout signout link');