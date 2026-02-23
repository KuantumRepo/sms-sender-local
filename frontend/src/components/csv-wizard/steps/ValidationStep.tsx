import React, { useMemo, useState, useEffect } from 'react';
import { getTemplates, Template, API_BASE } from '../../../lib/api';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ValidationStepProps {
    data: any[];
    mapping: Record<string, string>;
    onBack: () => void;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({
    data,
    mapping,
    onBack
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Fetch templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templateKey, setTemplateKey] = useState('');
    const [batchSize, setBatchSize] = useState<number>(100);

    useEffect(() => {
        getTemplates()
            .then(data => {
                setTemplates(data);
                if (data.length > 0) setTemplateKey(data[0].key);
            })
            .catch(err => console.error("Failed to fetch templates:", err));
    }, []);

    // Client-side validation logic
    const folderData = useMemo(() => {
        let valid = 0;
        let invalid = 0;
        const errors: { row: number; reason: string }[] = [];
        const validRows: any[] = [];

        data.forEach((row, index) => {
            const phoneHeader = mapping['phone'];
            const phone = row[phoneHeader]; // Raw value

            // Basic check: is it non-empty? 
            if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
                invalid++;
                errors.push({ row: index + 1, reason: 'Missing or invalid phone number' });
            } else {
                valid++;
                // Construct standardized row
                const newRow: any = { ...row };
                // Ensure 'phone' key exists for backend
                newRow['phone'] = phone;
                validRows.push(newRow);
            }
        });

        return { valid, invalid, errors, validRows };
    }, [data, mapping]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const headers = Object.keys(folderData.validRows[0] || {});

            const csvContent = [
                headers.join(','),
                ...folderData.validRows.map(row =>
                    headers.map(header => {
                        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                        return `"${val.replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const formData = new FormData();
            formData.append('file', blob, 'import.csv');
            formData.append('template_key', templateKey || 'default');
            formData.append('batch_size', String(batchSize));

            const response = await fetch(`${API_BASE}/batches`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const result = await response.json();
            console.log('Batch created:', result);

            alert('Batch created successfully!');
            window.location.reload();

        } catch (err) {
            console.error("Submission error:", err);
            alert('Failed to create batch: ' + err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-mono font-bold text-emerald-500">&gt;_payload_review</h2>
                <p className="font-mono text-sm text-emerald-500/50 uppercase tracking-widest">
                    [ analyzing targets before transmission ]
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold text-white">{folderData.valid}</span>
                    <span className="text-sm font-medium text-slate-400">Valid Contacts</span>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full ${folderData.invalid > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {folderData.invalid > 0 ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                    </div>
                    <span className={`text-3xl font-bold ${folderData.invalid > 0 ? 'text-red-500' : 'text-white'}`}>
                        {folderData.invalid}
                    </span>
                    <span className="text-sm font-medium text-slate-400">Invalid / Missing Phone</span>
                </div>
            </div>

            {/* Template Selection */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Message Template</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={templateKey}
                            onChange={e => setTemplateKey(e.target.value)}
                        >
                            {templates.length > 0 ? templates.map(t => (
                                <option key={t.key} value={t.key} className="text-slate-900 bg-white">
                                    {t.name} ({t.variations.length} variations)
                                </option>
                            )) : <option value="">Loading templates...</option>}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Batch Size</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={batchSize}
                            onChange={e => setBatchSize(parseInt(e.target.value) || 100)}
                        />
                        <p className="text-xs text-slate-500">Number of messages per API request.</p>
                    </div>
                </div>
            </div>

            {/* Error Details */}
            {folderData.errors.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 bg-red-900/10 flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-white">Issues Found</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Row</th>
                                    <th className="px-6 py-3">Issue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {folderData.errors.map((err, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/50">
                                        <td className="px-6 py-3 font-mono text-slate-400">#{err.row}</td>
                                        <td className="px-6 py-3 text-red-400">{err.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || folderData.valid === 0}
                    className={`
            flex items-center space-x-2 px-8 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-all
            ${folderData.valid > 0
                            ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                            : 'bg-slate-800 cursor-not-allowed text-slate-500'}
          `}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Start Import</span>
                            <Send className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
