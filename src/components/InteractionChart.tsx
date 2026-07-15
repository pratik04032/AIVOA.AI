import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Activity, Users, Tag } from 'lucide-react';

interface Interaction {
  id: string;
  createdAt: string;
  date: string;
  hcpName?: string;
  interactionType?: string;
}

interface InteractionChartProps {
  interactions: Interaction[];
}

export default function InteractionChart({ interactions }: InteractionChartProps) {
  const { totalInteractions, uniqueHCPs, mostCommonType, chartData } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days inclusive
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentInteractions = interactions.filter(i => {
      const d = new Date(i.date || i.createdAt);
      return d >= thirtyDaysAgo && d <= today;
    });

    const uniqueHCPSet = new Set(recentInteractions.map(i => i.hcpName || "Unknown"));
    
    const typeCounts: Record<string, number> = {};
    recentInteractions.forEach(i => {
      const type = i.interactionType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Chart Data Preparation
    const dateMap = new Map<string, number>();
    
    // Initialize exactly 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(key, 0);
    }

    recentInteractions.forEach(interaction => {
      const d = new Date(interaction.date || interaction.createdAt);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dateMap.has(key)) {
          dateMap.set(key, (dateMap.get(key) || 0) + 1);
        }
      }
    });

    const data = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    return {
      totalInteractions: recentInteractions.length,
      uniqueHCPs: uniqueHCPSet.size,
      mostCommonType: mostCommon,
      chartData: data
    };
  }, [interactions]);

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          Interaction Summary (Last 30 Days)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wide">Total Interactions</div>
              <div className="text-2xl font-bold text-slate-800 leading-none">{totalInteractions}</div>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wide">Unique HCPs</div>
              <div className="text-2xl font-bold text-slate-800 leading-none">{uniqueHCPs}</div>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-0.5 uppercase tracking-wide">Most Common</div>
              <div className="text-lg font-bold text-slate-800 leading-none truncate max-w-[120px]" title={mostCommonType}>
                {mostCommonType}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={10}
                interval={Math.floor(chartData.length / 5)} 
              />
              <YAxis 
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              />
              <Bar 
                dataKey="count" 
                name="Interactions" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#6366f1' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
