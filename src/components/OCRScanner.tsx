import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';

export default function OCRScanner({ onExtracted }: { onExtracted: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Read as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      await scanImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async (base64: string, mimeType: string) => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType })
      });
      const data = await response.json();
      if (data) {
        onExtracted(data);
      }
      setTimeout(() => {
        setIsOpen(false);
        setPreviewUrl(null);
      }, 1000);
    } catch (error) {
      console.error("OCR failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Camera className="w-4 h-4" />
        Scan Card / Notes
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Scan Document (OCR)</h3>
          <button onClick={() => { setIsOpen(false); setPreviewUrl(null); }} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Click to upload image</p>
              <p className="text-xs text-slate-500">Business cards, handwritten notes, etc.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
              {isScanning && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-sm font-bold text-slate-700">Extracting details...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
