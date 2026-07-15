import { useState, useEffect } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

export default function HCPInsights({ hcpName, history }: { hcpName: string, history: any[] }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hcpName || history.length === 0) {
      setInsight(null);
      return;
    }

    const fetchInsight = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/chat/summarize-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            formState: { 
              note: `Provide a single very brief sentence insight (e.g. "Usually prefers emails, shows positive sentiment") based on this history for ${hcpName}: ${JSON.stringify(history.slice(0, 5))}` 
            } 
          })
        });
        const data = await response.json();
        setInsight(data.summary);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [hcpName, history]);

  if (!hcpName || history.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex gap-2 items-start">
      <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h5 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">AI Field Insight</h5>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            <span className="text-xs text-indigo-500 italic">Generating insight...</span>
          </div>
        ) : (
          <p className="text-xs text-indigo-700 leading-relaxed">{insight}</p>
        )}
      </div>
    </div>
  );
}
