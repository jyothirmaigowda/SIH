'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.caseId;
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('FIR');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);
    formData.append('description', description);

    try {
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      setFile(null);
      setDescription('');
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceVersion = async (documentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const replaceFile = e.target.files?.[0];
    if (!replaceFile) return;
    
    const formData = new FormData();
    formData.append('file', replaceFile);

    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Replacement failed');
      }
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message); // Simple alert for row-level error
    }
  };

  if (loading) return <div className="p-8">Loading documents...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 data-testid="page-heading" className="text-2xl font-bold mb-6">Case Documents</h1>
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
        <form onSubmit={handleUploadNew} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            >
              <option value="FIR">FIR</option>
              <option value="FORENSIC_REPORT">Forensic Report</option>
              <option value="WITNESS_STATEMENT">Witness Statement</option>
              <option value="SEIZURE_MEMO">Seizure Memo</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
              placeholder="Brief description"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF/Image)</label>
            <input 
              type="file" 
              required
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full border-gray-300 rounded-md shadow-sm p-1.5 border bg-white"
            />
          </div>
          <button 
            type="submit" 
            disabled={uploading || !file}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 font-medium h-10"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Desc</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latest Hash (SHA-256)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No documents found.</td>
              </tr>
            ) : documents.map((doc) => {
              const latest = doc.versions[0];
              return (
                <tr key={doc.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{doc.type}</div>
                    <div className="text-sm text-gray-500">{doc.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-gray-500 break-all">{latest?.sha256Hash}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      v{latest?.versionNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/api/documents/${doc.id}/download`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Download
                    </a>
                    <label className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                      Replace
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleReplaceVersion(doc.id, e)}
                      />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}