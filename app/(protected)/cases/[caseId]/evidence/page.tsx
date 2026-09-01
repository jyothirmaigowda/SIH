'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function EvidencePage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const router = useRouter();
  
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    evidenceRef: '',
    type: 'PHYSICAL',
    description: '',
    source: '',
    collectionPlace: '',
    collectedAt: new Date().toISOString().slice(0, 16)
  });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchEvidence();
  }, [caseId]);

  const fetchEvidence = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/evidence`);
      if (!res.ok) throw new Error('Failed to fetch evidence');
      const data = await res.json();
      setEvidenceList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setError('');

    try {
      const res = await fetch(`/api/cases/${caseId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          collectedAt: new Date(form.collectedAt).toISOString()
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      setForm({
        evidenceRef: '',
        type: 'PHYSICAL',
        description: '',
        source: '',
        collectionPlace: '',
        collectedAt: new Date().toISOString().slice(0, 16)
      });
      await fetchEvidence();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="p-8">Loading evidence...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 data-testid="page-heading" className="text-2xl font-bold mb-6">Evidence Registry</h1>
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Register New Evidence</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Reference / Tag</label>
            <input type="text" required value={form.evidenceRef} onChange={e => setForm({...form, evidenceRef: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="e.g., EVD-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
              <option value="BIOLOGICAL">Biological</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source (e.g. Person, Location)</label>
            <input type="text" required value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection Place</label>
            <input type="text" required value={form.collectionPlace} onChange={e => setForm({...form, collectionPlace: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection Time</label>
            <input type="datetime-local" required value={form.collectedAt} onChange={e => setForm({...form, collectedAt: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
          </div>
          <button type="submit" disabled={registering} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium h-10 w-full">
            {registering ? 'Registering...' : 'Register Evidence'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref & Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evidenceList.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No evidence found.</td></tr>
            ) : evidenceList.map((ev) => (
              <tr key={ev.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{ev.evidenceRef}</div>
                  <div className="text-xs text-gray-500">{ev.type}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{ev.description}</div>
                  <div className="text-xs text-gray-500">From: {ev.source}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {ev.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => router.push(`/cases/${caseId}/custody?evidenceId=${ev.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Custody Chain
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}