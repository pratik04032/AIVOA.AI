/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, RootState, updateMultipleFields } from './store.ts';
import InteractionForm from './components/InteractionForm.tsx';
import ChatAssistant from './components/ChatAssistant.tsx';
import HCPPerformanceOverlay from './components/HCPPerformanceOverlay.tsx';
import PrintInteraction from './components/PrintInteraction.tsx';
import { useEffect, useState, useRef } from 'react';

function AppContent() {
  const dispatch = useDispatch();
  const formState = useSelector((state: RootState) => state.interaction);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | ''>('');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const initialLoadDone = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hcpInteractionDraft');
    const savedTime = localStorage.getItem('hcpInteractionDraftTime');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch(updateMultipleFields(parsed));
        if (savedTime) {
          setLastSavedTime(savedTime);
          setSaveStatus('saved');
        }
      } catch (e) {
        console.error('Failed to parse draft from local storage', e);
      }
    }
    initialLoadDone.current = true;
  }, [dispatch]);

  // Save to localStorage when formState changes
  useEffect(() => {
    if (!initialLoadDone.current) return;
    
    setSaveStatus('saving');
    const timeoutId = setTimeout(() => {
      localStorage.setItem('hcpInteractionDraft', JSON.stringify(formState));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('hcpInteractionDraftTime', now);
      setLastSavedTime(now);
      setSaveStatus('saved');
    }, 1500); // debounce save 1.5s for "smart" feel

    return () => clearTimeout(timeoutId);
  }, [formState]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-900 print:h-auto print:bg-white print:block">
      <PrintInteraction />
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800">Log HCP Interaction</h1>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Active</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPerformanceOverlay(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors rounded-lg text-sm font-semibold border border-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Performance
          </button>
          <div className="flex flex-col items-end">
            {saveStatus === 'saving' && <span className="text-xs text-slate-400">Auto-saving draft...</span>}
            {saveStatus === 'saved' && lastSavedTime && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Draft saved at {lastSavedTime}</span>}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden print:hidden">
        
        {/* Viewer Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Form Side (Mock Preview style) */}
          <div className="flex-1 bg-slate-200 p-4 sm:p-8 flex justify-center overflow-hidden">
            <div className="w-full max-w-4xl bg-white shadow-2xl h-full flex flex-col overflow-hidden rounded-md sm:rounded-lg">
              <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                  <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Interaction Form</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-12">
                <InteractionForm />
              </div>
            </div>
          </div>

          {/* Right Chat Side (Action Pane style) */}
          <div className="w-80 sm:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                AI Assistant
              </h2>
              <p className="text-xs text-slate-500 mt-1">Log interaction via chat</p>
            </div>
            <ChatAssistant />
          </div>
        </div>
      </main>
      
      {showPerformanceOverlay && (
        <HCPPerformanceOverlay onClose={() => setShowPerformanceOverlay(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
