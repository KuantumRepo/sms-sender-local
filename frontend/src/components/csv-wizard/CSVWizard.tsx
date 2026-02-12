import React, { useState } from 'react';
import { UploadStep } from './steps/UploadStep';
import { MappingStep } from './steps/MappingStep';
import { ValidationStep } from './steps/ValidationStep';
import { LayoutList, Settings, CheckSquare } from 'lucide-react';

export const CSVWizard: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [mapping, setMapping] = useState<Record<string, string>>({});

    const handleDataParsed = (data: any[], headers: string[], name: string) => {
        setFileData(data);
        setHeaders(headers);
        setFileName(name);
        setStep(2);
    };

    const handleMappingConfirm = (newMapping: Record<string, string>) => {
        setMapping(newMapping);
        setStep(3);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    const reset = () => {
        setStep(1);
        setFileData([]);
        setHeaders([]);
        setFileName('');
        setMapping({});
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Stepper Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-slate-900">Import Contacts</h1>
                        <p className="text-sm text-slate-500">Upload and configure your recipient list</p>
                    </div>

                    {/* Steps Indicator */}
                    <div className="flex items-center space-x-4">
                        {[
                            { num: 1, label: 'Upload', icon: LayoutList },
                            { num: 2, label: 'Map', icon: Settings },
                            { num: 3, label: 'Review', icon: CheckSquare },
                        ].map((s, idx) => (
                            <div key={s.num} className="flex items-center">
                                <div className={`
                            flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors
                            ${step === s.num ? 'bg-white shadow-sm ring-1 ring-slate-200 text-blue-600' :
                                        step > s.num ? 'text-green-600' : 'text-slate-400'}
                        `}>
                                    <s.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{s.label}</span>
                                </div>
                                {idx < 2 && <div className="w-8 h-px bg-slate-200 mx-2" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 min-h-[500px]">
                {step === 1 && (
                    <UploadStep onDataParsed={handleDataParsed} />
                )}

                {step === 2 && (
                    <MappingStep
                        headers={headers}
                        sampleData={fileData}
                        onMappingConfirm={handleMappingConfirm}
                        onBack={handleBack}
                    />
                )}

                {step === 3 && (
                    <ValidationStep
                        data={fileData}
                        mapping={mapping}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
    );
};
