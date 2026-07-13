/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider } from 'react-redux';
import { store } from './store.ts';
import InteractionForm from './components/InteractionForm.tsx';
import ChatAssistant from './components/ChatAssistant.tsx';

export default function App() {
  return (
    <Provider store={store}>
      <div className="flex flex-col h-screen w-full bg-slate-50 font-sans overflow-hidden text-slate-900">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">Log HCP Interaction</h1>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Active</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          
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
      </div>
    </Provider>
  );
}
