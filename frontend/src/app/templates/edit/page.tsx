'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getTemplates, createTemplate, updateTemplate, Template } from '../../../lib/api';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

function TemplateFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const isNew = id === 'new';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Template>({
        name: '',
        key: '',
        variations: [{ message_text: '' }]
    });

    useEffect(() => {
        if (!isNew) {
            // Find the template to edit. Real app might fetch by ID directly.
            getTemplates().then(temps => {
                const found = temps.find(t => t.id === id);
                if (found) setFormData(found);
            });
        }
    }, [isNew, id]);

    const addVariation = () => {
        setFormData(prev => ({
            ...prev,
            variations: [...prev.variations, { message_text: '' }]
        }));
    };

    const removeVariation = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variations: prev.variations.filter((_, i) => i !== index)
        }));
    };

    const updateVariation = (index: number, text: string) => {
        const newVars = [...formData.variations];
        newVars[index].message_text = text;
        setFormData({ ...formData, variations: newVars });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.key) {
            return alert('Name and Key are required.');
        }
        if (formData.variations.length === 0 || formData.variations.some(v => !v.message_text.trim())) {
            return alert('All variations must have message text.');
        }

        setLoading(true);
        try {
            if (isNew) {
                await createTemplate(formData);
            } else {
                await updateTemplate(formData.id!, formData);
            }
            router.push('/templates');
        } catch (e: any) {
            alert('Error saving template: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="flex items-center space-x-4">
                    <Link href="/templates" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-mono font-bold text-emerald-500 tracking-wider">
                            {isNew ? '>_create_payload' : '>_edit_payload'}
                        </h1>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Display Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Amazon Security Update"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">System Key (Unique)</label>
                            <input
                                type="text"
                                placeholder="e.g. amazon_update_01"
                                disabled={!isNew}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                value={formData.key}
                                onChange={e => setFormData({ ...formData, key: e.target.value })}
                            />
                            {!isNew && <p className="text-xs text-slate-500">System key cannot be changed after creation.</p>}
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white">Message Variations</h3>
                            <button
                                onClick={addVariation}
                                className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium px-3 py-1.5 bg-blue-500/10 rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Variation</span>
                            </button>
                        </div>

                        <p className="text-sm text-slate-400">
                            Add multiple variations below to spin syntax. The sender will randomly select one of these for each recipient to improve deliverability.
                        </p>

                        <div className="space-y-4 mt-6">
                            {formData.variations.map((v, idx) => (
                                <div key={idx} className="flex flex-col space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 relative group">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono text-slate-500 font-semibold tracking-wider">VARIATION {idx + 1}</span>
                                        {formData.variations.length > 1 && (
                                            <button
                                                onClick={() => removeVariation(idx)}
                                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-transparent border-0 text-slate-300 focus:ring-0 p-0 text-sm resize-none"
                                        placeholder="Enter your SMS message content here..."
                                        value={v.message_text}
                                        onChange={(e) => updateVariation(idx, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Saving...' : 'Save Template'}</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function TemplateFormPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <TemplateFormContent />
        </Suspense>
    );
}
