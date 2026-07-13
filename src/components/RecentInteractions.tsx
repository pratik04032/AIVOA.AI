import { useEffect, useState } from 'react';

interface Interaction {
  id: number;
  hcpName: string;
  interactionType: string;
  summary: string;
  createdAt: string;
}

export default function RecentInteractions({ refreshTrigger }: { refreshTrigger: number }) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const response = await fetch('/api/hcps/interactions/recent');
        const data = await response.json();
        setInteractions(data);
      } catch (error) {
        console.error('Failed to fetch recent interactions', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInteractions();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="p-4 text-center text-slate-500 text-sm">Loading recent interactions...</div>;
  }

  if (interactions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-slate-200 pt-8">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Recently Logged Interactions</h3>
      <div className="space-y-3">
        {interactions.map((interaction) => (
          <div key={interaction.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-bold text-slate-800">{interaction.hcpName}</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{interaction.interactionType}</span>
                <span className="text-[10px] text-slate-400 font-mono">{new Date(interaction.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {interaction.summary && (
              <div className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {interaction.summary}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
