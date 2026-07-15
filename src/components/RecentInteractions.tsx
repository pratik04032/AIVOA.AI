import { useEffect, useState, useMemo } from 'react';
import InteractionChart from './InteractionChart.tsx';
import InteractionHeatmap from './InteractionHeatmap.tsx';

interface Interaction {
  id: string;
  hcpName: string;
  interactionType: string;
  summary: string;
  createdAt: string;
  date: string;
  followUpDate?: string;
  outcomes?: string;
  followUpActions?: string;
}

interface HCP {
  id: string;
  name: string;
  specialty: string;
}

export default function RecentInteractions({ refreshTrigger }: { refreshTrigger: number }) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [hcps, setHcps] = useState<Record<string, string>>({}); // name -> specialty
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hcpSearchHistory');
    if (saved) {
      try { setSearchHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('hcpSearchHistory', JSON.stringify(newHistory));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [interactionsRes, hcpsRes] = await Promise.all([
          fetch('/api/hcps/interactions/all'),
          fetch('/api/hcps')
        ]);
        
        const interactionsData = await interactionsRes.json();
        const hcpsData: HCP[] = await hcpsRes.json();
        
        const hcpMap: Record<string, string> = {};
        hcpsData.forEach(h => {
          hcpMap[h.name] = h.specialty;
        });
        
        setInteractions(interactionsData);
        setHcps(hcpMap);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch data', error);
        setError('Failed to load interactions. You might be offline or the server is starting.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction => {
      const specialty = hcps[interaction.hcpName] || '';
      
      // Search match (name, specialty, or date)
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        interaction.hcpName.toLowerCase().includes(query) ||
        specialty.toLowerCase().includes(query) ||
        (interaction.date && interaction.date.includes(query));
        
      // Type match
      const matchesType = filterType === '' || interaction.interactionType === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [interactions, hcps, searchQuery, filterType]);

  const handleExport = () => {
    const csvHeader = "HCP Name,Specialty,Interaction Type,Date,Summary,Outcomes,Follow-up Actions,Follow-up Date\n";
    const csvData = filteredInteractions.map(i => `"${i.hcpName}","${hcps[i.hcpName] || ''}","${i.interactionType}","${i.date || new Date(i.createdAt).toLocaleDateString()}","${(i.summary || '').replace(/"/g, '""')}","${(i.outcomes || '').replace(/"/g, '""')}","${(i.followUpActions || '').replace(/"/g, '""')}","${i.followUpDate || ''}"`).join("\n");
    const csvContent = csvHeader + csvData;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "interactions_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredInteractions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "interactions_report.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-500 text-sm flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading recent interactions...</div>;
  }

  if (error) {
    return (
      <div className="mt-8 border-t border-slate-200 pt-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center flex flex-col items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {error}
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md font-bold text-xs transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 border-t border-slate-200 pt-8">
      <InteractionHeatmap history={interactions} />
      <InteractionChart interactions={interactions} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recently Logged Interactions</h3>
        
        <div className="flex gap-3 w-full sm:w-auto items-center">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsHistoryDropdownOpen(!isHistoryDropdownOpen)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              History
            </button>
            
            {isHistoryDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Interaction History</h4>
                  <button onClick={() => setIsHistoryDropdownOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {interactions.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {interactions.map(interaction => (
                        <div key={interaction.id} className="p-3 hover:bg-slate-50 transition-colors text-left">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="text-xs font-bold text-slate-700">{interaction.hcpName}</span>
                              <span className="text-[10px] text-slate-500 ml-2 uppercase">{interaction.interactionType}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">{interaction.date || new Date(interaction.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{interaction.summary || 'No summary available.'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No interactions found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export Options
            </button>
            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden flex flex-col">
                <button 
                  onClick={handleExport}
                  className="px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Export CSV
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>
          
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search name, specialty, date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(searchQuery);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white placeholder-slate-400 transition-colors shadow-sm"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            
            {isSearchFocused && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  Recent Searches
                </div>
                {searchHistory.map((query, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setSearchQuery(query);
                      handleSearchSubmit(query);
                    }}
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {query}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white shadow-sm"
          >
            <option value="">All Types</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="Email">Email</option>
          </select>
        </div>
      </div>
      
      {filteredInteractions.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-sm text-slate-400 text-center">
          No interactions found matching your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInteractions.map((interaction) => (
            <div key={interaction.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">{interaction.hcpName}</h4>
                    {interaction.followUpDate && new Date(interaction.followUpDate) < new Date(new Date().setHours(0,0,0,0)) && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">Overdue Follow-up</span>
                    )}
                  </div>
                  {hcps[interaction.hcpName] && (
                    <span className="text-xs text-slate-500">{hcps[interaction.hcpName]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{interaction.interactionType}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{interaction.date || new Date(interaction.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {interaction.summary && (
                <div className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1">
                  {interaction.summary}
                </div>
              )}
              {interaction.followUpDate && (
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Follow-up: <span className="font-semibold">{new Date(interaction.followUpDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
