
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
          <a href="/api/auth/logout" className="block w-full text-center px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-sm">
            Sign Out
          </a>
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
