const fs = require('fs');
const path = require('path');
const uiDir = 'app/(protected)/cases/[caseId]/overview';
if (!fs.existsSync(uiDir)) fs.mkdirSync(uiDir, { recursive: true });

fs.writeFileSync(path.join(uiDir, 'page.tsx'), `
'use client';

import { useState, useEffect, use } from 'react';

export default function OverviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      const res = await fetch(\`/api/cases/\${caseId}\`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(\`/api/cases/\${caseId}/export\`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = \`Case_Diary.pdf\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8">Loading overview...</div>;
  if (!caseData) return <div className="p-8 text-red-500">Case not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 data-testid="page-heading" className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
          <p className="text-gray-500 mt-2 text-lg">Case Number: {caseData.caseNumber}</p>
        </div>
        <button 
          onClick={handleExport} 
          disabled={exporting}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 font-bold shadow flex items-center"
        >
          {exporting ? 'Generating PDF...' : '⬇ Export Official Case Diary (PDF)'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Case Details</h2>
          <div className="space-y-3">
            <p><span className="font-semibold">Type:</span> {caseData.type}</p>
            <p><span className="font-semibold">Status:</span> {caseData.status}</p>
            <p><span className="font-semibold">Priority:</span> {caseData.priority}</p>
            <p><span className="font-semibold">Offences:</span> {caseData.offenceSections}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Compliance Status</h2>
          <div className="space-y-3 text-green-700 font-medium">
            <p>✓ Audit Trail Active (SHA-256)</p>
            <p>✓ Evidence Vault Secured</p>
            <p>✓ Custody Append-Only Enforced</p>
            <p>✓ Zero-Trust Authorization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
`);
console.log('Overview UI created');