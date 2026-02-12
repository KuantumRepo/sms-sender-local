import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface UploadStepProps {
    onDataParsed: (data: any[], headers: string[], fileName: string) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ onDataParsed }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFile = async (file: File) => {
        setError(null);
        setIsProcessing(true);

        const fileExt = file.name.split('.').pop()?.toLowerCase();

        const validExtensions = ['csv', 'xlsx', 'xls', 'txt'];
        if (!fileExt || !validExtensions.includes(fileExt)) {
            setError('Unsupported file type. Please upload CSV, Excel, or Text file.');
            setIsProcessing(false);
            return;
        }

        try {
            if (fileExt === 'csv') {
                parseCSV(file);
            } else if (fileExt === 'xlsx' || fileExt === 'xls') {
                await parseExcel(file);
            } else if (fileExt === 'txt') {
                await parseText(file);
            }
        } catch (err: any) {
            setError(`Failed to process file: ${err.message}`);
            setIsProcessing(false);
        }
    };

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields && results.meta.fields.length > 0) {
                    onDataParsed(results.data, results.meta.fields, file.name);
                } else {
                    setError('CSV appears empty or missing headers.');
                }
                setIsProcessing(false);
            },
            error: (err) => {
                setError(`CSV Parse Error: ${err.message}`);
                setIsProcessing(false);
            }
        });
    };

    const parseExcel = async (file: File) => {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
            throw new Error("Excel sheet appears empty.");
        }

        // Extract headers from the first row keys
        const headers = Object.keys(jsonData[0] as object);
        onDataParsed(jsonData, headers, file.name);
        setIsProcessing(false);
    };

    const parseText = async (file: File) => {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
            throw new Error("Text file is empty.");
        }

        // Treat TXT as a single column list "Raw Content"
        const headers = ["Column 1"];
        const data = lines.map(line => ({ "Column 1": line.trim() }));

        onDataParsed(data, headers, file.name);
        setIsProcessing(false);
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
        e.target.value = '';
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
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }
        `}
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`
            p-4 rounded-full 
            ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}
          `}>
                        {isProcessing ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">
                            Upload your contact list
                        </h3>
                        <p className="text-sm text-slate-400">
                            Drag & drop or browse
                        </p>
                    </div>

                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center space-x-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="mt-8 flex justify-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>.csv, .txt</span>
                </div>
                <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>.xlsx, .xls</span>
                </div>
            </div>
        </div>
    );
};

// Simple Loader2 fallback if lucide-react doesn't have it (it typically does)
const Loader2 = ({ className }: { className?: string }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
