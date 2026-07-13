import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, addMessage, setTyping, updateMultipleFields, ChatMessage } from '../store.ts';

export default function ChatAssistant() {
  const dispatch = useDispatch();
  const { messages, isTyping } = useSelector((state: RootState) => state.chat);
  const formState = useSelector((state: RootState) => state.interaction);
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    dispatch(addMessage(userMsg));
    setInput('');
    dispatch(setTyping(true));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          formState,
        }),
      });

      const data = await response.json();
      
      if (data.updatedFormState) {
        dispatch(updateMultipleFields(data.updatedFormState));
      }
      
      dispatch(addMessage({ role: 'assistant', content: data.message || "I've updated the form based on your input." }));
    } catch (error) {
      console.error('Chat error:', error);
      dispatch(addMessage({ role: 'assistant', content: 'Sorry, there was an error processing your request.' }));
    } finally {
      dispatch(setTyping(false));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-800 rounded-lg rounded-bl-none px-3 py-2 text-sm shadow-sm flex space-x-1 items-center h-8">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe interaction..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="px-4 py-2 bg-gray-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Log
        </button>
      </div>
    </div>
  );
}
