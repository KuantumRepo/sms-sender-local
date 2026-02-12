import React, { useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface MappingStepProps {
    headers: string[];
    sampleData: any[]; // First few rows
    onMappingConfirm: (mapping: Record<string, string>) => void;
    onBack: () => void;
}

const REQUIRED_FIELDS = [
    { key: 'phone', label: 'Phone Number', required: true },
    { key: 'name', label: 'Contact Name', required: false },
    // Add more fields if needed
];

export const MappingStep: React.FC<MappingStepProps> = ({
    headers,
    sampleData,
    onMappingConfirm,
    onBack
}) => {
    const [mapping, setMapping] = React.useState<Record<string, string>>({});

    // Auto-map logic
    useEffect(() => {
        const newMapping: Record<string, string> = {};

        REQUIRED_FIELDS.forEach(field => {
            // Simple heuristic: check if header includes key word
            const match = headers.find(h =>
                h.toLowerCase().includes(field.key) ||
                (field.key === 'phone' && ['mobile', 'cell', 'number', 'contact'].some(k => h.toLowerCase().includes(k)))
            );

            if (match) {
                newMapping[field.key] = match;
            }
        });

        setMapping(newMapping);
    }, [headers]);

    const handleFieldChange = (systemField: string, csvHeader: string) => {
        setMapping(prev => ({
            ...prev,
            [systemField]: csvHeader
        }));
    };

    const isFormValid = () => {
        // Check if strict required fields are mapped
        return REQUIRED_FIELDS.filter(f => f.required).every(f => mapping[f.key]);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-white">Map Columns</h2>
                <p className="text-slate-400">
                    Match your CSV columns to the required fields. We'll show you a preview of the data below.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Mapping Controls */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm space-y-6">
                    <h3 className="font-semibold text-white mb-4">Field Mapping</h3>
                    {REQUIRED_FIELDS.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            <select
                                value={mapping[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className={`
                  w-full px-3 py-2 bg-slate-950 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white
                  ${!mapping[field.key] && field.required ? 'border-amber-500/50' : 'border-slate-800'}
                `}
                            >
                                <option value="" className="text-slate-500">Select a column...</option>
                                {headers.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Live Preview */}
                <div className="space-y-4">
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-sm font-semibold text-slate-300">Data Preview</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                                    <tr>
                                        {REQUIRED_FIELDS.map(f => (
                                            <th key={f.key} className="px-4 py-3 font-medium whitespace-nowrap">
                                                {f.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {sampleData.slice(0, 5).map((row, idx) => (
                                        <tr key={idx} className="bg-slate-950">
                                            {REQUIRED_FIELDS.map(f => {
                                                const mappedHeader = mapping[f.key];
                                                const cellValue = mappedHeader ? row[mappedHeader] : '-';
                                                return (
                                                    <td key={f.key} className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                                                        {cellValue || <span className="text-slate-600 italic">Empty</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                        Showing first 5 rows based on current mapping
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={() => onMappingConfirm(mapping)}
                    disabled={!isFormValid()}
                    className={`
            flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-all
            ${isFormValid()
                            ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                            : 'bg-slate-800 cursor-not-allowed text-slate-500'}
          `}
                >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
