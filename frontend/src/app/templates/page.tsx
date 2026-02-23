'use client';

import { useState, useEffect } from 'react';
import { getTemplates, deleteTemplate, Template } from '../../lib/api';
import { Trash2, Plus, MessageSquareText, FileEdit } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = () => {
        getTemplates()
            .then(setTemplates)
            .catch((e) => alert('Error loading templates: ' + e.message));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template completely? This affects future batches.')) return;
        try {
            await deleteTemplate(id);
            fetchTemplates();
        } catch (e: any) {
            alert('Failed to delete template: ' + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">

                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-mono font-bold text-emerald-500 tracking-wider">&gt;_clicker12_templates</h1>
                        <p className="font-mono text-emerald-500/50 uppercase text-sm tracking-widest">[ manage transmission payloads ]</p>
                    </div>
                    <Link
                        href="/templates/edit?id=new"
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Template</span>
                    </Link>
                </div>

                {/* Templates List */}
                <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Name</th>
                                    <th className="px-6 py-4 font-semibold">System Key</th>
                                    <th className="px-6 py-4 font-semibold">Variations</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm">
                                {templates.map(template => (
                                    <tr key={template.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3 text-white font-medium">
                                                <MessageSquareText className="w-5 h-5 text-slate-500" />
                                                <span>{template.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{template.key}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-900/40 text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                                                {template.variations.length} options
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={`/templates/edit?id=${template.id}`}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Edit Template"
                                                >
                                                    <FileEdit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(template.id!)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Delete Template"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No templates found. Create one to get started.
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
