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
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none border border-blue-700/50'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-700 rounded-lg rounded-bl-none px-4 py-3 text-sm shadow-sm flex space-x-1.5 items-center h-10">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-3 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Describe interaction..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 resize-none text-slate-800 placeholder-slate-400 transition-colors"
        />
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-medium">Press Enter to send</span>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
          >
            Log
          </button>
        </div>
      </div>
    </div>
  );
}
