import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function InteractionMapOverlay({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch('/api/hcps/interactions/all')
      .then(res => res.json())
      .then(history => setData(history))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;
    
    const nodes: any[] = [];
    const links: any[] = [];
    
    const hcpMap = new Map();
    
    data.forEach((interaction, idx) => {
      const hcpName = interaction.hcpName || 'Unknown HCP';
      if (!hcpMap.has(hcpName)) {
        hcpMap.set(hcpName, { id: `hcp-${hcpName}`, type: 'hcp', name: hcpName, radius: 30 });
        nodes.push(hcpMap.get(hcpName));
      }
      
      const interactionNode = { 
        id: `int-${interaction.id || idx}`, 
        type: 'interaction', 
        name: interaction.interactionType || 'Interaction', 
        date: interaction.date,
        sentiment: interaction.sentiment,
        radius: 12
      };
      nodes.push(interactionNode);
      
      links.push({
        source: `hcp-${hcpName}`,
        target: interactionNode.id,
        value: 1
      });
    });

    const width = 1000;
    const height = 700;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", [0, 0, width, height]);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius((d: any) => d.radius + 10).iterations(2));

    const link = svg.append("g")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-opacity", 0.8)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any);

    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => {
           if (d.type === 'hcp') return "#3b82f6";
           if (d.sentiment === 'Positive') return "#10b981";
           if (d.sentiment === 'Negative') return "#ef4444";
           return "#f59e0b";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .attr("class", "shadow-sm cursor-pointer");

    node.append("text")
        .text(d => d.name)
        .attr("x", d => d.radius + 8)
        .attr("y", 4)
        .attr("font-size", d => d.type === 'hcp' ? '14px' : '11px')
        .attr("font-weight", d => d.type === 'hcp' ? 'bold' : 'normal')
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

      node
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Global Interaction Map
            </h2>
            <p className="text-xs text-slate-500 mt-1">Network visualization of HCP connections and interaction sentiment.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 relative bg-slate-50 flex items-center justify-center">
           <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
           {data.length === 0 && (
             <div className="absolute text-slate-400 font-medium flex items-center gap-2">
               <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Rendering map...
             </div>
           )}
           <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg text-xs font-medium text-slate-600">
             <div className="mb-2 font-bold text-slate-800">Legend</div>
             <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> HCP Node</div>
             <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Positive Interaction</div>
             <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Neutral Interaction</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Negative Interaction</div>
           </div>
        </div>
      </div>
    </div>
  );
}
