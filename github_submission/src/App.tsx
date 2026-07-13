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
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 border-b">
          <h1 className="text-xl font-semibold text-gray-800">Log HCP Interaction</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left Form Side */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
            <h2 className="text-lg font-medium text-gray-700 mb-6">Interaction Details</h2>
            <InteractionForm />
          </div>

          {/* Right Chat Side */}
          <div className="w-96 bg-gray-50 flex flex-col border-l border-gray-200">
            <div className="bg-blue-50 px-4 py-3 flex items-center border-b border-gray-200">
              <span className="text-blue-600 mr-2">✨</span>
              <h2 className="text-sm font-medium text-blue-900">AI Assistant</h2>
              <span className="text-xs text-blue-500 ml-2">Log interaction via chat</span>
            </div>
            <ChatAssistant />
          </div>
        </main>
      </div>
    </Provider>
  );
}
