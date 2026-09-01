
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
                <Link href={`/cases/${c.id}/overview`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow-sm">
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
