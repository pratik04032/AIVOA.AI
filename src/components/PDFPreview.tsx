import React, { useState, useRef } from 'react';
import { FileText, X, Upload } from 'lucide-react';

export default function PDFPreview() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    setPdfFile(file);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
  };

  const handleRemove = () => {
    setPdfFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  return (
    <div className="mt-4">
      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Material (PDF Preview)</h5>
      
      {!pdfFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Click to attach PDF</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf"
            className="hidden" 
          />
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden relative group">
          <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{pdfFile.name}</span>
            </div>
            <button 
              type="button" 
              onClick={handleRemove}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-48 w-full bg-slate-100 flex items-center justify-center">
             <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
