import { useDispatch, useSelector } from 'react-redux';
import { RootState, updateField, resetForm, clearHighlights, InteractionState, updateMultipleFields } from '../store.ts';
import { useState, useEffect } from 'react';
import RecentInteractions from './RecentInteractions.tsx';

const FormGroup = ({ title, icon, children }: any) => (
  <fieldset className="border border-slate-200 rounded-xl p-5 md:p-6 bg-white shadow-sm mb-8">
    <legend className="text-xs font-bold text-slate-800 tracking-wider uppercase px-3 ml-2 flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 py-1.5 shadow-sm">
      <span className="text-base">{icon}</span>
      {title}
    </legend>
    <div className="mt-2">
      {children}
    </div>
  </fieldset>
);

export default function InteractionForm() {
  const dispatch = useDispatch();
  const formState = useSelector((state: RootState) => state.interaction);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [sentenceSummary, setSentenceSummary] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string} | null>(null);

  const [hcpSearchQuery, setHcpSearchQuery] = useState('');
  const [hcpSearchResults, setHcpSearchResults] = useState<any[]>([]);
  const [isSearchingHcp, setIsSearchingHcp] = useState(false);
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);

  useEffect(() => {
    if (!hcpSearchQuery.trim()) {
      setHcpSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearchingHcp(true);
      fetch(`/api/hcps/search?q=${encodeURIComponent(hcpSearchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setHcpSearchResults(data);
          setShowHcpDropdown(true);
        })
        .catch(err => console.error("Failed to search HCPs", err))
        .finally(() => setIsSearchingHcp(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [hcpSearchQuery]);

  const handleSelectHcp = (hcp: any) => {
    dispatch(updateMultipleFields({
      hcpName: hcp.name,
      hcpSpecialty: hcp.specialty,
      hcpLocation: hcp.location
    }));
    setHcpSearchQuery(hcp.name);
    setShowHcpDropdown(false);
  };

  useEffect(() => {
    if (formState.hcpName?.trim()) {
      setLoadingHistory(true);
      fetch(`/api/hcps/${encodeURIComponent(formState.hcpName)}/interactions`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to load history", err))
        .finally(() => setLoadingHistory(false));
    } else {
      setHistory([]);
    }
  }, [formState.hcpName]);

  const calculateCompletion = () => {
    let score = 0;
    if (formState.hcpName?.trim()) score += 20;
    if (formState.date?.trim()) score += 20;
    if (formState.interactionType?.trim()) score += 10;
    if (formState.time?.trim()) score += 10;
    if (formState.topicsDiscussed?.trim()) score += 20;
    if (formState.outcomes?.trim()) score += 10;
    if (formState.followUpActions?.trim()) score += 10;
    return score;
  };

  const completionScore = calculateCompletion();
  
  useEffect(() => {
    if (formState.highlightedFields?.length > 0) {
      const timer = setTimeout(() => {
        dispatch(clearHighlights());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [formState.highlightedFields, dispatch]);

  const handleChange = (field: keyof InteractionState, value: string) => {
    dispatch(updateField({ field, value }));
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formState }),
      });
      const data = await response.json();
      if (data.summary) {
        handleChange('executiveSummary', data.summary);
      }
    } catch (error) {
      console.error('Failed to summarize', error);
      alert('Failed to generate summary. Please try again or check your connection.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSentenceSummary = async () => {
    setIsGeneratingSentence(true);
    try {
      const response = await fetch('/api/chat/summarize-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formState }),
      });
      const data = await response.json();
      if (data.summary) {
        setSentenceSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate sentence summary', error);
    } finally {
      setIsGeneratingSentence(false);
    }
  };

  const getInputClasses = (field: keyof InteractionState) => {
    const isHighlighted = formState.highlightedFields?.includes(field);
    return `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-800 bg-white placeholder-slate-400 transition-all duration-500 ${
      isHighlighted
        ? 'border-green-400 ring-4 ring-green-400/30 bg-green-50'
        : 'border-slate-200 focus:border-blue-500'
    }`;
  };

  const applyTemplate = (templateName: string) => {
    let templateData: Partial<InteractionState> = {};
    
    switch (templateName) {
      case 'Initial Meeting':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Introduction and general product overview.', sentiment: 'Neutral' };
        break;
      case 'Routine Follow-up':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Efficacy check and patient feedback.', sentiment: 'Positive' };
        break;
      case 'Product Launch':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Introduced new product features and reviewed latest clinical data.', materialsShared: 'Product Brochure', sentiment: 'Neutral' };
        break;
      case 'Adverse Event':
        templateData = { interactionType: 'Call', topicsDiscussed: 'Reported safety concern and discussed adverse event protocols.', followUpActions: 'Report to pharmacovigilance team.', sentiment: 'Negative' };
        break;
    }
    if (!formState.date) {
      templateData.date = new Date().toISOString().split('T')[0];
    }
    dispatch(updateMultipleFields(templateData));
  };

  const labelClasses = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
            <span className="text-base">✨</span> AI Quick Summary
          </h3>
          <button
            type="button"
            onClick={handleSentenceSummary}
            disabled={isGeneratingSentence}
            className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
          >
            {isGeneratingSentence ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
        <div className="text-sm text-slate-700 min-h-[1.5rem]">
          {sentenceSummary ? (
            <p className="animate-in fade-in duration-500 font-medium">{sentenceSummary}</p>
          ) : (
            <p className="text-slate-400 italic">Click generate for a one-sentence summary of the current data.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Meeting Templates</h3>
        <div className="flex flex-wrap gap-2">
          {['Initial Meeting', 'Routine Follow-up', 'Product Launch', 'Adverse Event'].map(t => (
            <button
              key={t}
              onClick={() => applyTemplate(t)}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-sm"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <FormGroup title="Basic Information" icon="📋">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={labelClasses}>HCP Name <span className="text-red-500">*</span></label>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search or select HCP..."
                value={hcpSearchQuery || formState.hcpName}
                onChange={(e) => {
                  setHcpSearchQuery(e.target.value);
                  handleChange('hcpName', e.target.value);
                  setShowHcpDropdown(true);
                }}
                className={`${getInputClasses('hcpName')} pl-9`}
                onFocus={() => setShowHcpDropdown(true)}
                onBlur={() => setTimeout(() => setShowHcpDropdown(false), 200)}
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              {showHcpDropdown && hcpSearchQuery.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearchingHcp ? (
                    <div className="p-3 text-xs text-slate-500 text-center">Searching...</div>
                  ) : hcpSearchResults.length > 0 ? (
                    hcpSearchResults.map((hcp, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleSelectHcp(hcp)}
                      >
                        <div className="font-bold text-sm text-slate-800">{hcp.name}</div>
                        <div className="text-xs text-slate-500">{hcp.specialty} • {hcp.location}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-500 text-center">No results found</div>
                  )}
                </div>
              )}
            </div>

            {(formState.hcpSpecialty || formState.hcpLocation) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <div className="flex flex-col">
                  {formState.hcpSpecialty && <span className="font-medium text-slate-700">{formState.hcpSpecialty}</span>}
                  {formState.hcpLocation && <span className="text-slate-500">{formState.hcpLocation}</span>}
                </div>
              </div>
            )}
            
            {formState.hcpName?.trim() && (
              <div className="mt-3 bg-blue-50/50 rounded-lg border border-blue-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Recent History
                  </h4>
                  {loadingHistory && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                {!loadingHistory && history.length === 0 && (
                  <p className="text-xs text-blue-600/70 italic">No previous interactions found.</p>
                )}
                {!loadingHistory && history.length > 0 && (
                  <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                    {history.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="text-xs bg-white rounded p-2 border border-blue-100/50 flex justify-between items-start gap-2">
                        <div>
                          <span className="font-semibold text-slate-700">{item.interactionType}</span>
                          <span className="text-slate-500 block truncate max-w-[150px]" title={item.topicsDiscussed}>{item.topicsDiscussed || 'No topics listed'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">{new Date(item.date || item.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
          <div>
            <label className={labelClasses}>Interaction Type</label>
            <select
              value={formState.interactionType}
              onChange={(e) => handleChange('interactionType', e.target.value)}
              className={getInputClasses('interactionType')}
            >
              <option value="">Select...</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={labelClasses}>Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formState.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={getInputClasses('date')}
            />
          </div>
          <div>
            <label className={labelClasses}>Time</label>
            <input
              type="time"
              value={formState.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className={getInputClasses('time')}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Attendees</label>
          <input
            type="text"
            placeholder="Enter names or search..."
            value={formState.attendees}
            onChange={(e) => handleChange('attendees', e.target.value)}
            className={getInputClasses('attendees')}
          />
          <p className="text-[10px] text-slate-500 mt-1">Separate multiple names with commas.</p>
        </div>
      </FormGroup>

      <FormGroup title="Discussion Notes" icon="💬">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Topics Discussed</label>
            <span className="text-[10px] text-slate-400 font-mono">{formState.topicsDiscussed.length} chars</span>
          </div>
          <textarea
            placeholder="Enter key discussion points..."
            rows={3}
            value={formState.topicsDiscussed}
            onChange={(e) => handleChange('topicsDiscussed', e.target.value)}
            className={getInputClasses('topicsDiscussed')}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-slate-500">Include main questions asked and objections raised.</p>
            <button className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center transition-colors shadow-sm">
              <span className="mr-1.5">🎙️</span> Summarize from Voice Note (Requires Consent)
            </button>
          </div>
        </div>
      </FormGroup>

      <FormGroup title="Materials & Samples" icon="📦">
        <div className="mb-6">
          <div className="flex items-center justify-between py-2 border-b border-slate-200/60 mb-2">
            <span className="text-sm text-slate-600 font-medium">Materials Shared</span>
            <button className="text-[11px] font-semibold px-2.5 py-1 border border-slate-200 text-slate-600 rounded bg-white hover:bg-slate-50 transition-colors shadow-sm">🔍 Search/Add</button>
          </div>
          <input
            type="text"
            list="materials-options"
            placeholder="e.g. Product Brochure, Trial Kit..."
            value={formState.materialsShared}
            onChange={(e) => handleChange('materialsShared', e.target.value)}
            className={getInputClasses('materialsShared')}
          />
          <datalist id="materials-options">
            <option value="Product Brochure" />
            <option value="Trial Kit" />
            <option value="Clinical Trial Data" />
            <option value="Dosing Guide" />
            <option value="Patient Education Leaflet" />
          </datalist>
          <div className="flex flex-wrap gap-2 mt-2">
            {['Product Brochure', 'Trial Kit', 'Clinical Trial Data'].map((opt) => (
              <button 
                key={opt}
                onClick={() => handleChange('materialsShared', formState.materialsShared ? `${formState.materialsShared}, ${opt}` : opt)}
                className="px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-600 rounded shadow-sm hover:bg-slate-50 transition-colors"
              >
                + {opt}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between py-2 border-b border-slate-200/60 mb-2">
            <span className="text-sm text-slate-600 font-medium">Samples Distributed</span>
            <button className="text-[11px] font-semibold px-2.5 py-1 border border-slate-200 text-slate-600 rounded bg-white hover:bg-slate-50 transition-colors shadow-sm">➕ Add Sample</button>
          </div>
          <input
            type="text"
            list="samples-options"
            placeholder="e.g. 5x 10mg Tablets..."
            value={formState.samplesDistributed}
            onChange={(e) => handleChange('samplesDistributed', e.target.value)}
            className={getInputClasses('samplesDistributed')}
          />
          <datalist id="samples-options">
            <option value="10mg Tablets (Box of 30)" />
            <option value="20mg Tablets (Box of 30)" />
            <option value="Starter Pack" />
            <option value="50mg Injection" />
          </datalist>
          <div className="flex flex-wrap gap-2 mt-2">
            {['10mg Tablets (Box of 30)', 'Starter Pack', '50mg Injection'].map((opt) => (
              <button 
                key={opt}
                onClick={() => handleChange('samplesDistributed', formState.samplesDistributed ? `${formState.samplesDistributed}, ${opt}` : opt)}
                className="px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-600 rounded shadow-sm hover:bg-slate-50 transition-colors"
              >
                + {opt}
              </button>
            ))}
          </div>
        </div>
      </FormGroup>

      <FormGroup title="Outcomes & Next Steps" icon="🎯">
        <div className={`p-4 -mx-4 rounded-lg transition-all duration-500 mb-6 ${formState.highlightedFields?.includes('sentiment') ? 'bg-green-50 ring-2 ring-green-400/30' : ''}`}>
        <label className={labelClasses}>Observed/Inferred HCP Sentiment</label>
        <div className="flex space-x-6 mt-2">
          {['Positive', 'Neutral', 'Negative'].map((sentiment) => (
            <label key={sentiment} className="flex items-center space-x-2.5 text-sm text-slate-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="sentiment"
                value={sentiment}
                checked={formState.sentiment === sentiment}
                onChange={(e) => handleChange('sentiment', e.target.value)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>{sentiment}</span>
            </label>
          ))}
        </div>
        </div>
        
        <div className="space-y-6">
          <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Outcomes</label>
            <span className="text-[10px] text-slate-400 font-mono">{formState.outcomes.length} chars</span>
          </div>
          <textarea
            placeholder="Key outcomes or agreements..."
            rows={2}
            value={formState.outcomes}
            onChange={(e) => handleChange('outcomes', e.target.value)}
            className={getInputClasses('outcomes')}
          />
          <p className="text-[10px] text-slate-500 mt-1">What was agreed upon? e.g., "Agreed to review literature by Friday."</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Follow-up Actions</label>
              <span className="text-[10px] text-slate-400 font-mono">{formState.followUpActions.length} chars</span>
            </div>
            <textarea
              placeholder="Enter next steps or tasks..."
              rows={2}
              value={formState.followUpActions}
              onChange={(e) => handleChange('followUpActions', e.target.value)}
              className={getInputClasses('followUpActions')}
            />
            <p className="text-[10px] text-slate-500 mt-1">Specific tasks to be done before the next meeting.</p>
          </div>
          <div>
            <label className={labelClasses}>Follow-up Date</label>
            <input
              type="date"
              value={formState.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              className={getInputClasses('followUpDate')}
            />
            {formState.followUpDate && new Date(formState.followUpDate) < new Date(new Date().setHours(0,0,0,0)) && (
              <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1 animate-in fade-in">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                This follow-up date is overdue!
              </p>
            )}
          </div>
        </div>
        </div>
      </FormGroup>
      
      {formState.followUpActions && (
        <section className="p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
          <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">AI Suggested Follow-ups</h4>
          <ul className="text-xs text-blue-700 space-y-2">
            <li className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 p-1.5 -mx-1.5 rounded transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="font-medium">Schedule follow-up meeting in 2 weeks</span>
            </li>
            <li className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 p-1.5 -mx-1.5 rounded transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="font-medium">Send OncoBoost Phase III PDF</span>
            </li>
            <li className="flex items-center gap-2 cursor-pointer hover:bg-blue-100/50 p-1.5 -mx-1.5 rounded transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="font-medium">Add Dr. Sharma to advisory board invite list</span>
            </li>
          </ul>
        </section>
      )}

      <section className="pt-6 mt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Executive Summary</h3>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {isSummarizing ? (
              <>
                 <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Generating...
              </>
            ) : (
              <>✨ Auto-Summarize</>
            )}
          </button>
        </div>
        {formState.executiveSummary ? (
          <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {formState.executiveSummary}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-sm text-slate-400 italic text-center">
            Click Auto-Summarize to generate a brief, AI-powered overview of this interaction.
          </div>
        )}
      </section>

      <section className="pt-6 mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            dispatch(resetForm());
            localStorage.removeItem('hcpInteractionDraft');
          }}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          Clear All
        </button>
        <button
          type="button"
          disabled={!formState.hcpName || !formState.date}
          onClick={async () => {
            if (!formState.hcpName || !formState.date) return;
            try {
              await fetch('/api/hcps/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState),
              });
              dispatch(resetForm());
              localStorage.removeItem('hcpInteractionDraft');
              setRefreshTrigger(prev => prev + 1);
              setToastMessage({ title: 'Success', message: 'Interaction successfully saved to the CRM.' });
              setTimeout(() => setToastMessage(null), 3000);
            } catch (error) {
              console.error('Failed to save interaction', error);
            }
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg ${!formState.hcpName || !formState.date ? 'bg-blue-400 text-white cursor-not-allowed shadow-blue-400/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
        >
          Save Interaction
        </button>
      </section>

      <RecentInteractions refreshTrigger={refreshTrigger} />

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-white border border-green-200 shadow-xl rounded-lg p-4 flex gap-3 items-start animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 max-w-sm">
          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{toastMessage.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{toastMessage.message}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      )}
    </div>
  );
}
