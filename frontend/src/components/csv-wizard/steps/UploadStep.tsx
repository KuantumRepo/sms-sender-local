import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface UploadStepProps {
    onDataParsed: (data: any[], headers: string[], fileName: string) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ onDataParsed }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = (file: File) => {
        setError(null);

        // Validate file type
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error("CSV Parse Errors:", results.errors);
                    // For now, allow minor errors unless consistent api failure
                }

                if (!results.meta.fields || results.meta.fields.length === 0) {
                    setError('CSV file appears to be empty or missing headers.');
                    return;
                }

                onDataParsed(results.data, results.meta.fields, file.name);
            },
            error: (err) => {
                setError(`Failed to parse CSV: ${err.message}`);
            }
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out
          ${isDragging
                        ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }
        `}
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`
            p-4 rounded-full 
            ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}
          `}>
                        <Upload className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Upload your contact list
                        </h3>
                        <p className="text-sm text-slate-500">
                            Drag and drop your CSV file here, or click to browse
                        </p>
                    </div>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center space-x-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-slate-400">
                <FileText className="w-4 h-4" />
                <span>Supported format: .csv</span>
            </div>
        </div>
    );
};
