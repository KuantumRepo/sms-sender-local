'use client';

import { useState, useEffect, useRef } from 'react';
import { uploadBatch, getBatches, getTemplates, Batch, Template } from '../lib/api';

export default function Dashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateKey, setTemplateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [batchesData, templatesData] = await Promise.all([
        getBatches(),
        getTemplates()
      ]);
      setBatches(batchesData);
      setTemplates(templatesData);
      if (templatesData.length > 0 && !templateKey) {
        setTemplateKey(templatesData[0].key);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      getBatches().then(setBatches).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    setLoading(true);
    try {
      await uploadBatch(fileInputRef.current.files[0], templateKey);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const batchesData = await getBatches();
      setBatches(batchesData);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">SMS Batch Sender</h1>

      <div className="bg-white p-6 rounded shadow mb-8 text-black">
        <h2 className="text-xl font-semibold mb-4">Send New Batch</h2>
        <p className="text-sm text-gray-600 mb-4">
          Manage templates in <code>templates.json</code> in the project root.
        </p>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Template</label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {templates.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
              {templates.length === 0 && <option>No templates found</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload CSV</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload & Send'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow text-black">
        <h2 className="text-xl font-semibold mb-4">Recent Batches</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">ID</th>
                <th className="p-2">Template</th>
                <th className="p-2">Total</th>
                <th className="p-2">Success</th>
                <th className="p-2">Failed</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(batch => (
                <tr key={batch.id} className="border-b">
                  <td className="p-2 text-sm">{batch.id}</td>
                  <td className="p-2">{batch.template_key}</td>
                  <td className="p-2">{batch.total_numbers}</td>
                  <td className="p-2 text-green-600">{batch.success_count}</td>
                  <td className="p-2 text-red-600">{batch.failure_count}</td>
                  <td className="p-2 font-medium">{batch.status}</td>
                  <td className="p-2">
                    <a
                      href={`http://localhost:8000/batches/${batch.id}/export`}
                      target="_blank"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Export CSV
                    </a>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">No batches found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
