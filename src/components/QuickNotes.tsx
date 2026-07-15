import React, { useState, useEffect } from 'react';

export default function QuickNotes() {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('quickNotes');
    if (saved) setNotes(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem('quickNotes', val);
  };

  return (
    <div className="flex flex-col h-full bg-yellow-50/50">
      <div className="p-5 flex-1 flex flex-col">
        <textarea
          className="flex-1 w-full bg-transparent resize-none outline-none text-[13px] text-slate-700 placeholder-slate-400/70 leading-relaxed font-medium"
          placeholder="Jot down quick thoughts, reminders, or unstructured notes here. These auto-save locally..."
          value={notes}
          onChange={handleChange}
        />
      </div>
      <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-slate-500">
         <span>{notes.length} chars</span>
         {notes.length > 0 && <span className="text-emerald-600 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Saved</span>}
      </div>
    </div>
  );
}
