'use client';

import { useState, useEffect } from 'react';
import { getBatches, Batch } from '../lib/api';
import { CSVWizard } from '../components/csv-wizard/CSVWizard';

export default function Dashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    // Initial fetch
    getBatches().then(setBatches).catch(console.error);

    // Poll for updates
    const interval = setInterval(() => {
      getBatches().then(setBatches).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">SMS Batch Campaign</h1>
          <p className="text-slate-500">Manage your contacts and campaigns efficiently</p>
        </div>

        {/* New 3-Step Wizard */}
        <section>
          <CSVWizard />
        </section>

        {/* Batches List */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-xl font-bold text-slate-900">Recent Batches</h2>
            <button
              onClick={() => getBatches().then(setBatches)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Template</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Success</th>
                  <th className="px-6 py-4 font-semibold">Failed</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{batch.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{batch.template_key}</td>
                    <td className="px-6 py-4 text-slate-600">{batch.total_numbers}</td>
                    <td className="px-6 py-4 text-green-600 font-medium bg-green-50/50 rounded-lg">{batch.success_count}</td>
                    <td className="px-6 py-4 text-red-600 font-medium bg-red-50/50 rounded-lg">{batch.failure_count}</td>
                    <td className="px-6 py-4">
                      <span className={`
                            px-2.5 py-1 rounded-full text-xs font-semibold
                            ${batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                          batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'}
                        `}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`http://localhost:8000/batches/${batch.id}/export`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Download CSV
                      </a>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No batches found. Start by importing a contact list above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
