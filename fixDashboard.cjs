const fs = require('fs');
const path = require('path');

// 1. Build a global layout for protected pages (Sidebar + Topbar)
const layoutPath = 'app/(protected)/layout.tsx';
fs.writeFileSync(layoutPath, `
import Link from 'next/link';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider">SIMS</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-4">
            <li>
              <Link href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-800">
                Dashboard
              </Link>
            </li>
            <li className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Case</li>
            <li>
              <Link href="/cases/CASE-001/overview" className="block px-4 py-2 text-sm rounded-md hover:bg-gray-800">
                Overview & Export
              </Link>
            </li>
            <li>
              <Link href="/cases/CASE-001/documents" className="block px-4 py-2 text-sm rounded-md hover:bg-gray-800">
                Documents Vault
              </Link>
            </li>
            <li>
              <Link href="/cases/CASE-001/evidence" className="block px-4 py-2 text-sm rounded-md hover:bg-gray-800">
                Evidence & Custody
              </Link>
            </li>
            <li>
              <Link href="/cases/CASE-001/graph" className="block px-4 py-2 text-sm rounded-md hover:bg-gray-800">
                Intelligence Graph
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/api/auth/logout" className="block w-full text-center px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm">
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-8">
          <h2 className="text-lg font-medium text-gray-800">Secure Investigation Management System</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
`);

// 2. Build a real Dashboard
const dashboardPath = 'app/(protected)/dashboard/page.tsx';
fs.writeFileSync(dashboardPath, `
import Link from 'next/link';
import { prisma } from '@/lib/db';

export default async function Dashboard() {
  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Investigator Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">Active Cases</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{cases.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-gray-500 text-sm uppercase font-semibold">System Status</h3>
          <p className="text-xl font-bold text-green-600 mt-2 flex items-center">
             <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Secure
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Assigned Cases</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {cases.map((c) => (
            <div key={c.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{c.caseNumber}</h3>
                <p className="text-gray-600">{c.title}</p>
                <p className="text-sm text-gray-500 mt-1">Status: <span className="font-semibold text-gray-700">{c.status}</span></p>
              </div>
              <div className="flex space-x-3">
                <Link href={\`/cases/\${c.id}/overview\`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow-sm">
                  Open Case Workspace
                </Link>
              </div>
            </div>
          ))}
          {cases.length === 0 && (
            <div className="p-6 text-gray-500">No active cases found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
`);

console.log('Layout and Dashboard applied!');