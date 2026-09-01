const fs = require('fs');
const path = 'app/page.tsx';

fs.writeFileSync(path, `
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect the root of the website to the dashboard.
  // The middleware (proxy.ts) will automatically intercept this and bounce unauthenticated users to /login
  redirect('/dashboard');
}
`);
console.log('Fixed root page!');