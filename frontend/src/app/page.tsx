'use client';

import { useState, useEffect } from 'react';
import { getBatches, Batch } from '../lib/api';
import { CSVWizard } from '../components/csv-wizard/CSVWizard';

import { Trash2, Square, Download } from 'lucide-react';

export default function Dashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    // Initial fetch
    getBatches().then(setBatches).catch(console.error);

    // Poll for updates
    const interval = setInterval(() => {
      getBatches().then(setBatches).catch(console.error);
    }, 3000); // Faster polling for responsiveness
    return () => clearInterval(interval);
  }, []);

  const handleStop = async (id: string) => {
    if (!confirm('Are you sure you want to stop this campaign? The batch will halt immediately.')) return;
    try {
      await fetch(`http://localhost:8000/batches/${id}/cancel`, { method: 'POST' });
      getBatches().then(setBatches);
    } catch (e) {
      alert('Failed to stop batch: ' + e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to completely delete this campaign history? This will stop it instantly if running and wipe all data.')) return;
    try {
      await fetch(`http://localhost:8000/batches/${id}`, { method: 'DELETE' });
      setBatches(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      alert('Failed to delete batch: ' + e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">SMS Batch Campaign</h1>
          <p className="text-slate-400">Manage your contacts and campaigns efficiently</p>
        </div>

        {/* New 3-Step Wizard */}
        <section>
          <CSVWizard />
        </section>

        {/* Batches List */}
        <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <h2 className="text-xl font-bold text-white">Recent Batches</h2>
            <button
              onClick={() => getBatches().then(setBatches)}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Template</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Progress</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{batch.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 font-medium text-white">{batch.template_key}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{batch.total_numbers}</td>

                    {/* Progress Bar */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1.5 w-48">
                        <div className="flex justify-between text-xs font-medium">
                          <span className={`
                                ${batch.status === 'completed' ? 'text-green-400' :
                              batch.status === 'cancelled' ? 'text-orange-400' :
                                batch.status === 'failed' ? 'text-red-400' :
                                  'text-blue-400 animate-pulse'}
                              `}>
                            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                          </span>
                          <span className="text-slate-500">
                            {Math.round(((batch.success_count + batch.failure_count) / batch.total_numbers) * 100)}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all duration-500"
                            style={{ width: `${(batch.success_count / batch.total_numbers) * 100}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all duration-500"
                            style={{ width: `${(batch.failure_count / batch.total_numbers) * 100}%` }}
                          />
                        </div>
                        <div className="flex text-[10px] text-slate-500 space-x-2">
                          <span>{batch.success_count} sent</span>
                          <span>•</span>
                          <span>{batch.failure_count} failed</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Download */}
                        <a
                          href={`http://localhost:8000/batches/${batch.id}/export`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Download CSV"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Stop (if running) */}
                        {batch.status === 'running' && (
                          <button
                            onClick={() => handleStop(batch.id)}
                            className="p-2 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Stop Campaign"
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                        )}

                        {/* Delete (Always available) */}
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {batches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
