import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HCPTrendAnalysis({ history }: { history: any[] }) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Group by month
    const monthCounts = new Map<string, number>();
    const sortedHistory = [...history].sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
    
    sortedHistory.forEach(item => {
      const d = new Date(item.date || item.createdAt);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
      }
    });

    return Array.from(monthCounts.entries()).map(([date, count]) => ({ date, count }));
  }, [history]);

  if (chartData.length < 2) return null; // Only show if we have enough data points

  return (
    <div className="mt-3 p-3 bg-white/50 rounded-lg border border-blue-100/50">
      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Interaction Frequency</h5>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ fontSize: '10px', borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}
            />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
