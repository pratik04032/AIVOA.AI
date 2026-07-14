import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

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
  const chartRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { totalInteractions, uniqueHCPs, mostCommonType } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
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

    return {
      totalInteractions: recentInteractions.length,
      uniqueHCPs: uniqueHCPSet.size,
      mostCommonType: mostCommon
    };
  }, [interactions]);

  useEffect(() => {
    if (!chartRef.current || !wrapperRef.current || interactions.length === 0) return;


    const renderChart = () => {
      // Clear previous chart
      d3.select(chartRef.current).selectAll('*').remove();

      // Process data for last 30 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const dateCounts = new Map<string, number>();
      
      // Initialize map with 0s for last 30 days
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(thirtyDaysAgo.getDate() + i + 1);
        const dateStr = d3.timeFormat('%Y-%m-%d')(d);
        dateCounts.set(dateStr, 0);
      }

      // Populate counts
      interactions.forEach(interaction => {
        const d = new Date(interaction.date || interaction.createdAt);
        if (!isNaN(d.getTime())) {
          const dateStr = d3.timeFormat('%Y-%m-%d')(d);
          if (dateCounts.has(dateStr)) {
            dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
          }
        }
      });

      const data = Array.from(dateCounts.entries()).map(([date, count]) => ({
        date: new Date(date),
        count
      }));

      // Setup dimensions
      const margin = { top: 10, right: 10, bottom: 20, left: 30 };
      const width = wrapperRef.current!.clientWidth - margin.left - margin.right;
      const height = 180 - margin.top - margin.bottom;

      const svg = d3.select(chartRef.current)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const x = d3.scaleTime()
        .domain([thirtyDaysAgo, today])
        .range([0, width]);

      const yMax = Math.max(1, d3.max(data, d => d.count) as number);

      const y = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);

      // Axes
      const yAxisTicks = Math.min(yMax, 5);
      const yAxis = d3.axisLeft(y).ticks(yAxisTicks).tickFormat(d3.format('d'));

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat('%b %d') as any))
        .attr('color', '#94a3b8')
        .selectAll('text')
        .attr('class', 'text-[10px] font-mono fill-slate-500');

      svg.append('g')
        .call(yAxis)
        .attr('color', '#94a3b8')
        .selectAll('text')
        .attr('class', 'text-[10px] font-mono fill-slate-500');

      // Grid lines
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(yAxisTicks).tickSize(-width).tickFormat('' as any))
        .attr('color', '#f8fafc');

      // Remove grid lines domain
      svg.selectAll('.grid .domain').remove();

      // Bars
      const barWidth = Math.max(2, (width / 30) - 2);

      svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.date) - barWidth / 2)
        .attr('y', d => y(d.count))
        .attr('width', barWidth)
        .attr('height', d => height - y(d.count))
        .attr('fill', '#3b82f6')
        .attr('rx', 2)
        .attr('opacity', 0.8)
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1).attr('fill', '#2563eb');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.8).attr('fill', '#3b82f6');
        });
    };

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      renderChart();
    });
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [interactions]);

  if (interactions.length === 0) return null;

  return (
    <div className="mb-6 p-5 bg-white border border-slate-200 rounded-lg shadow-sm" ref={wrapperRef}>
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Interaction Summary (Last 30 Days)</h4>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Total Interactions</div>
          <div className="text-2xl font-bold text-slate-800">{totalInteractions}</div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Unique HCPs</div>
          <div className="text-2xl font-bold text-slate-800">{uniqueHCPs}</div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Most Common</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{mostCommonType}</div>
        </div>
      </div>

      <div ref={chartRef} className="w-full h-[180px]" />
    </div>
  );
}
