const fs = require('fs');
const path = require('path');
const uiDir = 'app/(protected)/cases/[caseId]/graph';
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

fs.writeFileSync(path.join(uiDir, 'page.tsx'), `
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function GraphPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const router = useRouter();

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nodeForm, setNodeForm] = useState({ label: '', nodeType: 'PERSON' });
  const [edgeForm, setEdgeForm] = useState({ fromNodeId: '', toNodeId: '', relationship: 'INVOLVED_IN' });
  
  const [submittingNode, setSubmittingNode] = useState(false);
  const [submittingEdge, setSubmittingEdge] = useState(false);

  useEffect(() => {
    fetchGraph();
  }, [caseId]);

  const fetchGraph = async () => {
    try {
      const res = await fetch(\`/api/cases/\${caseId}/graph\`);
      if (!res.ok) throw new Error('Failed to fetch graph');
      const data = await res.json();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNode(true);
    setError('');
    try {
      const res = await fetch(\`/api/cases/\${caseId}/graph/nodes\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeForm)
      });
      if (!res.ok) throw new Error('Failed to create node');
      setNodeForm({ label: '', nodeType: 'PERSON' });
      await fetchGraph();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingNode(false);
    }
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdge(true);
    setError('');
    try {
      const res = await fetch(\`/api/cases/\${caseId}/graph/edges\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeForm)
      });
      if (!res.ok) throw new Error('Failed to create edge');
      setEdgeForm({ fromNodeId: '', toNodeId: '', relationship: 'INVOLVED_IN' });
      await fetchGraph();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingEdge(false);
    }
  };

  if (loading) return <div className="p-8">Loading graph...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      
      {/* Left Pane: Entity Management */}
      <div className="w-1/3 space-y-8">
        <h1 data-testid="page-heading" className="text-2xl font-bold">Intelligence Graph</h1>
        
        {error && <div className="bg-red-50 text-red-700 p-4 rounded text-sm">{error}</div>}

        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Add Node</h2>
          <form onSubmit={handleCreateNode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Label</label>
              <input type="text" required value={nodeForm.label} onChange={e => setNodeForm({...nodeForm, label: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" placeholder="e.g. John Doe, Red Toyota" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={nodeForm.nodeType} onChange={e => setNodeForm({...nodeForm, nodeType: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                <option value="PERSON">Person</option>
                <option value="LOCATION">Location</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="EVIDENCE">Evidence</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
            <button type="submit" disabled={submittingNode} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full disabled:bg-blue-400">
              {submittingNode ? 'Adding...' : 'Add Node'}
            </button>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Link Entities (Edge)</h2>
          <form onSubmit={handleCreateEdge} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Node</label>
              <select required value={edgeForm.fromNodeId} onChange={e => setEdgeForm({...edgeForm, fromNodeId: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                <option value="">Select source...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.nodeType})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <select value={edgeForm.relationship} onChange={e => setEdgeForm({...edgeForm, relationship: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                <option value="INVOLVED_IN">Involved In</option>
                <option value="LINKED_TO">Linked To</option>
                <option value="WITNESS_OF">Witness Of</option>
                <option value="OWNER_OF">Owner Of</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Node</label>
              <select required value={edgeForm.toNodeId} onChange={e => setEdgeForm({...edgeForm, toNodeId: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm p-2 border">
                <option value="">Select target...</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.nodeType})</option>)}
              </select>
            </div>
            <button type="submit" disabled={submittingEdge} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full disabled:bg-indigo-400">
              {submittingEdge ? 'Linking...' : 'Create Link'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Pane: Relational Map */}
      <div className="w-2/3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[600px]">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Relational Map</h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Edges (Connections)</h3>
            <div className="space-y-3" data-testid="edge-list">
              {edges.length === 0 ? (
                <p className="text-sm text-gray-400">No relationships mapped yet.</p>
              ) : edges.map(edge => {
                const from = nodes.find(n => n.id === edge.fromNodeId);
                const to = nodes.find(n => n.id === edge.toNodeId);
                return (
                  <div key={edge.id} className="bg-white p-4 rounded shadow-sm border border-gray-200 flex items-center justify-between">
                    <div className="flex-1 text-center font-semibold text-blue-800 bg-blue-50 py-2 rounded">{from?.label}</div>
                    <div className="mx-4 text-xs font-bold text-gray-500 px-3 py-1 border rounded-full bg-gray-100">{edge.relationship}</div>
                    <div className="flex-1 text-center font-semibold text-purple-800 bg-purple-50 py-2 rounded">{to?.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">All Nodes ({nodes.length})</h3>
            <div className="flex flex-wrap gap-2" data-testid="node-list">
              {nodes.map(n => (
                <span key={n.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                  {n.label} <span className="ml-2 text-xs text-gray-500 opacity-75">{n.nodeType}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
`);
console.log('Graph UI created');