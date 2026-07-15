import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Interaction {
  hcpName: string;
  sentiment: string;
  date: string;
  duration?: number; // mock this if not available
}

export default function HCPPerformanceOverlay({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Interaction[]>([]);
  const svgRef1 = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);
  const svgRef3 = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Fetch all interactions
    fetch('/api/hcps/interactions/all')
      .then(res => res.json())
      .then((history: any[]) => {
        // Mock duration if missing, based on interactionType
        const processed = history.map(d => ({
          ...d,
          duration: d.duration || (d.interactionType === 'Meeting' ? 60 : d.interactionType === 'Call' ? 30 : 15)
        }));
        setData(processed);
      })
      .catch(err => console.error("Failed to fetch history", err));
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    // 1. Total interactions per HCP (Bar chart)
    if (svgRef1.current) {
      const svg = d3.select(svgRef1.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 250;
      const margin = { top: 20, right: 20, bottom: 60, left: 40 };

      const rollupData = d3.rollup(data, (v: any) => v.length, (d: any) => d.hcpName);
      const chartData = Array.from(rollupData, ([key, value]) => ({ name: key, value }));
      
      // limit to top 5
      chartData.sort((a, b) => b.value - a.value);
      const topData = chartData.slice(0, 5);

      const x = d3.scaleBand()
        .domain(topData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.value) || 10]).nice()
        .range([height - margin.bottom, margin.top]);

      svg.append("g")
        .attr("fill", "steelblue")
        .selectAll("rect")
        .data(topData)
        .join("rect")
        .attr("x", d => x(d.name)!)
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth());

      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-15)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
    }

    // 2. Sentiment Score Trends (Line chart)
    if (svgRef2.current) {
      const svg = d3.select(svgRef2.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 250;
      const margin = { top: 20, right: 20, bottom: 40, left: 40 };

      // Map sentiment to score
      const sentimentScore = (s: string) => s === 'Positive' ? 1 : s === 'Negative' ? -1 : 0;
      
      const timelineData = data
        .filter(d => d.date)
        .map(d => ({
          date: new Date(d.date),
          score: sentimentScore(d.sentiment)
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Group by date and average
      const grouped = d3.rollup(timelineData, (v: any) => d3.mean(v, (d: any) => d.score) || 0, (d: any) => d.date.toISOString().split('T')[0]);
      const lineData = Array.from(grouped, ([key, value]) => ({ date: new Date(key), score: value }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (lineData.length > 0) {
        const x = d3.scaleTime()
          .domain(d3.extent(lineData, d => d.date) as [Date, Date])
          .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
          .domain([-1, 1])
          .range([height - margin.bottom, margin.top]);

        const line = d3.line<{date: Date, score: number}>()
          .x(d => x(d.date))
          .y(d => y(d.score));

        svg.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", "#10b981")
          .attr("stroke-width", 2)
          .attr("d", line);

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(3).tickFormat(d => d === 1 ? 'Pos' : d === -1 ? 'Neg' : 'Neu'));
      }
    }

    // 3. Time spent per interaction for each HCP (Box or Bar)
    if (svgRef3.current) {
      const svg = d3.select(svgRef3.current);
      svg.selectAll("*").remove();

      const width = 400;
      const height = 250;
      const margin = { top: 20, right: 20, bottom: 60, left: 40 };

      // Average duration per HCP
      const rollupData = d3.rollup(data, (v: any) => d3.mean(v, (d: any) => d.duration) || 0, (d: any) => d.hcpName);
      const chartData = Array.from(rollupData, ([key, value]) => ({ name: key, value }));
      chartData.sort((a, b) => b.value - a.value);
      const topData = chartData.slice(0, 5);

      const x = d3.scaleBand()
        .domain(topData.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(topData, d => d.value) || 60]).nice()
        .range([height - margin.bottom, margin.top]);

      svg.append("g")
        .attr("fill", "#8b5cf6")
        .selectAll("rect")
        .data(topData)
        .join("rect")
        .attr("x", d => x(d.name)!)
        .attr("y", d => y(d.value))
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth());

      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-15)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
    }

  }, [data]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            HCP Performance Dashboard
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider text-center">Top HCPs by Interactions</h3>
            <svg ref={svgRef1} width="400" height="250" className="w-full h-auto max-w-md"></svg>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider text-center">Sentiment Trends</h3>
            <svg ref={svgRef2} width="400" height="250" className="w-full h-auto max-w-md"></svg>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider text-center">Avg Time Spent (mins)</h3>
            <svg ref={svgRef3} width="400" height="250" className="w-full h-auto max-w-md"></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
