
import React, { useState, useRef } from 'react';
import { FileUp, FileText, Table as TableIcon, CheckCircle, AlertCircle, Loader2, Download, Trash2, ShieldCheck } from 'lucide-react';
import { OutputFormat, ProcessingStep, FileInfo } from './types';
import { analyzeDocument } from './services/geminiService';
import { exportFile } from './services/fileExporter';

const App: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [format, setFormat] = useState<OutputFormat>(OutputFormat.WORD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'analyze', label: 'Local data extraction', status: 'pending' },
    { id: 'generate', label: 'Generating download file', status: 'pending' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStep = (id: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      });
      setError(null);
      resetSteps();
    } else if (file) {
      setError('Please select a valid PDF file.');
    }
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
  };

  const handleProcess = async () => {
    if (!fileInfo) return;
    
    setIsProcessing(true);
    setError(null);
    resetSteps();

    try {
      // Step 1: Local Analysis (Text Extraction)
      updateStep('analyze', 'loading');
      const result = await analyzeDocument(fileInfo.file, format);
      updateStep('analyze', 'completed');

      // Step 2: Export
      updateStep('generate', 'loading');
      await exportFile(result, format, fileInfo.name);
      updateStep('generate', 'completed');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during local conversion.');
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFileInfo(null);
    resetSteps();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            SmartPDF <span className="text-indigo-600">Local</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Convert PDFs privately and securely. All processing happens right here in your browser.
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-emerald-600 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>Privacy First: No API Connection Required</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            {!fileInfo ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer group"
              >
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileUp className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Click or drag to upload PDF</h3>
                <p className="text-sm text-slate-500">Fast local processing</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Preview */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-2 rounded">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 truncate max-w-[250px]">{fileInfo.name}</h4>
                      <p className="text-xs text-slate-500">{(fileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    disabled={isProcessing}
                    onClick={removeFile} 
                    className="text-slate-400 hover:text-red-500 p-2 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Format Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={isProcessing}
                    onClick={() => setFormat(OutputFormat.WORD)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      format === OutputFormat.WORD 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <FileText className={`w-8 h-8 mb-2 ${format === OutputFormat.WORD ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${format === OutputFormat.WORD ? 'text-indigo-900' : 'text-slate-600'}`}>To Word</span>
                    <span className="text-xs text-slate-400 mt-1">Local Text Extractor</span>
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => setFormat(OutputFormat.EXCEL)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      format === OutputFormat.EXCEL 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <TableIcon className={`w-8 h-8 mb-2 ${format === OutputFormat.EXCEL ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${format === OutputFormat.EXCEL ? 'text-emerald-900' : 'text-slate-600'}`}>To Excel</span>
                    <span className="text-xs text-slate-400 mt-1">Local Data Parser</span>
                  </button>
                </div>

                {/* Convert Button */}
                <button
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Convert Locally</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Status Steps */}
          {(isProcessing || steps.some(s => s.status !== 'pending')) && (
            <div className="bg-slate-50 p-8 border-t border-slate-200">
              <h5 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Processing Progress</h5>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      {step.status === 'loading' && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
                      {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                      {step.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                      <span className={`text-sm font-medium ${
                        step.status === 'completed' ? 'text-slate-900' : 
                        step.status === 'loading' ? 'text-indigo-600' : 
                        step.status === 'error' ? 'text-red-600' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-t border-red-100 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>© 2024 SmartPDF Local. Secure, Offline-capable conversion.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
