import { useMemo } from 'react';

export default function InteractionHeatmap({ history }: { history: any[] }) {
  const { maxCount, days } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayMap = new Map<string, number>();

    // last 14 weeks (98 days)
    const weeks = 14;
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    // initialize
    for(let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dayMap.set(d.toISOString().split('T')[0], 0);
    }

    let max = 0;
    history.forEach(item => {
      const d = new Date(item.date || item.createdAt);
      if(!isNaN(d.getTime())) {
        const key = d.toISOString().split('T')[0];
        if(dayMap.has(key)) {
          const val = (dayMap.get(key) || 0) + 1;
          dayMap.set(key, val);
          if (val > max) max = val;
        }
      }
    });

    const daysArr = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
    return { maxCount: max, days: daysArr };
  }, [history]);

  const getDayColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count === 1) return 'bg-blue-200';
    if (count === 2) return 'bg-blue-400';
    if (count === 3) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm mb-6 overflow-x-auto">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Activity Heatmap (Last 14 Weeks)</h4>
      <div className="flex gap-1">
        {Array.from({ length: 14 }).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const day = days[weekIdx * 7 + dayIdx];
              if (!day) return null;
              return (
                <div 
                  key={day.date}
                  title={`${day.date}: ${day.count} interactions`}
                  className={`w-3.5 h-3.5 rounded-sm ${getDayColor(day.count)} transition-colors cursor-help`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 font-medium">
        <span>Less</span>
        <div className="w-3.5 h-3.5 rounded-sm bg-slate-100" />
        <div className="w-3.5 h-3.5 rounded-sm bg-blue-200" />
        <div className="w-3.5 h-3.5 rounded-sm bg-blue-400" />
        <div className="w-3.5 h-3.5 rounded-sm bg-blue-600" />
        <div className="w-3.5 h-3.5 rounded-sm bg-blue-800" />
        <span>More</span>
      </div>
    </div>
  );
}
