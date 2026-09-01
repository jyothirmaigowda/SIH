'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CustodyTimelinePage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const searchParams = useSearchParams();
  const evidenceId = searchParams.get('evidenceId');
  const router = useRouter();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    action: 'TRANSFERRED',
    place: '',
    purpose: '',
    notes: '',
    toUserId: '',
    occurredAt: new Date().toISOString().slice(0, 16)
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!evidenceId) {
      setError('No evidence selected.');
      setLoading(false);
      return;
    }
    fetchCustody();
  }, [caseId, evidenceId]);

  const fetchCustody = async () => {
    try {
      const res = await fetch(`/api/evidence/${evidenceId}/custody`);
      if (!res.ok) throw new Error('Failed to fetch custody chain');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/evidence/${evidenceId}/custody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          occurredAt: new Date(form.occurredAt).toISOString()
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update custody');
      }
      setForm({
        action: 'TRANSFERRED',
        place: '',
        purpose: '',
        notes: '',
        toUserId: '',
        occurredAt: new Date().toISOString().slice(0, 16)
      });
      await fetchCustody();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading custody chain...</div>;
  if (!evidenceId) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 data-testid="page-heading" className="text-2xl font-bold">Chain of Custody</h1>
        <button onClick={() => router.push(`/cases/${caseId}/evidence`)} className="text-blue-600 hover:underline">
          &larr; Back to Evidence Registry
        </button>
      </div>
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Immutable Timeline</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
            {events.length === 0 ? (
              <p className="text-gray-500">No custody events logged.</p>
            ) : events.map((event, idx) => (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="font-bold text-sm">{idx + 1}</span>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded shadow border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-900">{event.action}</span>
                    <time className="text-xs text-gray-500">{new Date(event.occurredAt).toLocaleString()}</time>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Location: {event.place}</div>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border break-all font-mono mb-2">
                    Hash: {event.eventHash.substring(0, 32)}...
                  </div>
                  <div className="text-xs text-gray-700">
                    <p><strong>Actor:</strong> {event.actor?.name || event.actorId}</p>
                    {event.toUserId && <p><strong>To:</strong> {event.toUser?.name || event.toUserId}</p>}
                    {event.purpose && <p><strong>Purpose:</strong> {event.purpose}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Log Custody Event</h2>
            <form onSubmit={handleAppendEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select value={form.action} onChange={e => setForm({...form, action: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="STORED">Stored</option>
                  <option value="CHECKED_OUT">Checked Out for Lab/Court</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Place</label>
                <input type="text" required value={form.place} onChange={e => setForm({...form, place: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input type="text" required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
              </div>
              {form.action === 'TRANSFERRED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To (Employee ID)</label>
                  <input type="text" value={form.toUserId} onChange={e => setForm({...form, toUserId: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="Leave blank if internal" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time of Event</label>
                <input type="datetime-local" required value={form.occurredAt} onChange={e => setForm({...form, occurredAt: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" rows={2} />
              </div>
              
              <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 font-medium w-full">
                {submitting ? 'Logging...' : 'Append Event'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}