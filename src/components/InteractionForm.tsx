import { useDispatch, useSelector } from 'react-redux';
import { RootState, updateField, resetForm, clearHighlights, InteractionState, updateMultipleFields } from '../store.ts';
import { useState, useEffect, useRef } from 'react';
import RecentInteractions from './RecentInteractions.tsx';
import { translations, Language } from '../translations.ts';
import HCPTrendAnalysis from './HCPTrendAnalysis.tsx';
import HCPInsights from './HCPInsights.tsx';
import OCRScanner from './OCRScanner.tsx';
import FollowUpScheduler from './FollowUpScheduler.tsx';
import PDFPreview from './PDFPreview.tsx';
import { vibrate } from '../utils/haptics.ts';

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
  const currentLanguage = useSelector((state: RootState) => state.app.language) as Language;
  const t = translations[currentLanguage];
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingSentence, setIsGeneratingSentence] = useState(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [sentenceSummary, setSentenceSummary] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string} | null>(null);

  const [hcpSearchQuery, setHcpSearchQuery] = useState('');
  const [hcpSearchResults, setHcpSearchResults] = useState<any[]>([]);
  const [isSearchingHcp, setIsSearchingHcp] = useState(false);
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);

  const [recordingField, setRecordingField] = useState<string | null>(null);
  
  // New States
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [conflictWarning, setConflictWarning] = useState(false);
  const [isSmartCompleting, setIsSmartCompleting] = useState(false);

  const recognitionRef = useRef<any>(null);

  const toggleRecording = (field: string) => {
    if (recordingField === field) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setRecordingField(null);
      return;
    }

    if (recordingField && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setRecordingField(field);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setFormStateCurrentValue(field, finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setRecordingField(null);
    };
    
    recognition.onend = () => setRecordingField(null);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const formStateRef = useRef(formState);
  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  const setFormStateCurrentValue = (field: string, transcript: string) => {
    const currentValue = formStateRef.current[field as keyof InteractionState] as string;
    const space = currentValue && !currentValue.endsWith(' ') ? ' ' : '';
    dispatch(updateField({ field: field as keyof InteractionState, value: currentValue ? currentValue + space + transcript : transcript }));
  };

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
    if (formState.hcpName?.trim()) score += 15;
    if (formState.date?.trim()) score += 15;
    if (formState.interactionType?.trim()) score += 10;
    if (formState.time?.trim()) score += 10;
    if (formState.topicsDiscussed?.trim()) score += 20;
    if (formState.outcomes?.trim()) score += 10;
    if (formState.followUpActions?.trim()) score += 10;
    if (formState.sentiment?.trim()) score += 10;
    return score;
  };

  const completionScore = calculateCompletion();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save draft, Cmd/Ctrl + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-interaction-btn');
        if (submitBtn && !submitBtn.hasAttribute('disabled')) {
          submitBtn.click();
        }
      }
      // Alt + S for Smart Complete
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleSmartComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formState]);

  useEffect(() => {
    if (formState.highlightedFields?.length > 0) {
      const timer = setTimeout(() => {
        dispatch(clearHighlights());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [formState.highlightedFields, dispatch]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  useEffect(() => {
    if (!isTimerRunning && timerSeconds > 0) {
      const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
      const s = (timerSeconds % 60).toString().padStart(2, '0');
      dispatch(updateField({ field: 'duration', value: `${m}:${s}` }));
    }
  }, [isTimerRunning, timerSeconds, dispatch]);

  useEffect(() => {
    if (formState.hcpName && formState.date) {
      fetch(`/api/hcps/interactions/all`)
        .then(res => res.json())
        .then((data: any[]) => {
          const conflict = data.some(i => i.hcpName === formState.hcpName && (i.date === formState.date || i.createdAt?.startsWith(formState.date)));
          setConflictWarning(conflict);
        })
        .catch(() => setConflictWarning(false));
    } else {
      setConflictWarning(false);
    }
  }, [formState.hcpName, formState.date]);

  const handleAutoCategorize = async () => {
    if (!formState.topicsDiscussed) {
      setToastMessage({ title: 'Missing Info', message: 'Please provide some discussion topics to auto-categorize.' });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    try {
      const response = await fetch('/api/chat/smart-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Based on this interaction text: "${formState.topicsDiscussed}", what is the most likely interaction type? Choose ONLY from: "Meeting", "Call", "Email". Return just the word.` 
        }),
      });
      const data = await response.json();
      const type = data.response.trim();
      if (['Meeting', 'Call', 'Email'].includes(type)) {
        dispatch(updateMultipleFields({ interactionType: type, highlightedFields: ['interactionType'] }));
        setToastMessage({ title: 'Categorized', message: `Auto-categorized as ${type}` });
      } else {
        setToastMessage({ title: 'Uncertain', message: 'Could not confidently categorize the interaction.' });
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      console.error("Auto categorize failed", error);
    }
  };

  const handleOcrExtracted = (data: any) => {
    const fieldsToUpdate: any = {};
    const highlightedFields: string[] = [];
    
    if (data.hcpName) { fieldsToUpdate.hcpName = data.hcpName; highlightedFields.push('hcpName'); }
    if (data.hcpSpecialty) { fieldsToUpdate.hcpSpecialty = data.hcpSpecialty; highlightedFields.push('hcpSpecialty'); }
    if (data.hcpLocation) { fieldsToUpdate.hcpLocation = data.hcpLocation; highlightedFields.push('hcpLocation'); }
    if (data.topicsDiscussed) { fieldsToUpdate.topicsDiscussed = data.topicsDiscussed; highlightedFields.push('topicsDiscussed'); }
    if (data.interactionType) { fieldsToUpdate.interactionType = data.interactionType; highlightedFields.push('interactionType'); }
    
    if (Object.keys(fieldsToUpdate).length > 0) {
      dispatch(updateMultipleFields({ ...fieldsToUpdate, highlightedFields }));
      setToastMessage({ title: 'OCR Success', message: 'Form populated from image.' });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({ title: 'OCR Note', message: 'No relevant data found in image.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSmartComplete = async () => {
    if (!formState.hcpName || !formState.interactionType) {
      setToastMessage({ title: 'Missing Info', message: 'Please provide HCP Name and Interaction Type for smart completion.' });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setIsSmartCompleting(true);
    try {
      const response = await fetch('/api/chat/smart-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Based on this partial interaction: HCP: ${formState.hcpName}, Specialty: ${formState.hcpSpecialty}, Type: ${formState.interactionType}. Please suggest topicsDiscussed, outcomes, and followUpActions. Return ONLY valid JSON format like: {"topicsDiscussed": "...", "outcomes": "...", "followUpActions": "..."}` 
        }),
      });
      const data = await response.json();
      let jsonStr = data.response;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      dispatch(updateMultipleFields({
        topicsDiscussed: formState.topicsDiscussed || parsed.topicsDiscussed,
        outcomes: formState.outcomes || parsed.outcomes,
        followUpActions: formState.followUpActions || parsed.followUpActions,
      }));
      setToastMessage({ title: 'Smart Complete', message: 'Fields auto-completed successfully.' });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      console.error("Smart complete failed", error);
      setToastMessage({ title: 'Error', message: 'Failed to auto-complete fields.' });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSmartCompleting(false);
    }
  };

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

  const handleAnalyzeSentiment = async () => {
    if (!formState.topicsDiscussed || formState.topicsDiscussed.trim() === '') return;
    setIsAnalyzingSentiment(true);
    try {
      const response = await fetch('/api/chat/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formState.topicsDiscussed }),
      });
      const data = await response.json();
      if (data.sentiment) {
        dispatch(updateMultipleFields({ 
          sentiment: data.sentiment, 
          highlightedFields: ['sentiment'] 
        }));
      }
    } catch (error) {
      console.error('Failed to analyze sentiment', error);
    } finally {
      setIsAnalyzingSentiment(false);
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
      case 'Clinical Education':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Educated HCP on latest clinical guidelines and trial results.', sentiment: 'Positive' };
        break;
      case 'Adverse Event Report':
        templateData = { interactionType: 'Call', topicsDiscussed: 'Received report of adverse event. Collected details for pharmacovigilance.', followUpActions: 'Submit formal AE report to compliance within 24h.', sentiment: 'Negative' };
        break;
      case 'Administrative':
        templateData = { interactionType: 'Email', topicsDiscussed: 'Account management, contracting, or scheduling.', sentiment: 'Neutral' };
        break;
      case 'Initial Meeting':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Introduction and general product overview.', sentiment: 'Neutral' };
        break;
      case 'Routine Follow-up':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Efficacy check and patient feedback.', sentiment: 'Positive' };
        break;
      case 'Product Launch':
        templateData = { interactionType: 'Meeting', topicsDiscussed: 'Introduced new product features and reviewed latest clinical data.', materialsShared: 'Product Brochure', sentiment: 'Neutral' };
        break;
    }
    if (Object.keys(templateData).length > 0) {
      if (!formState.date) {
        templateData.date = new Date().toISOString().split('T')[0];
      }
      dispatch(updateMultipleFields(templateData));
    }
  };

  const labelClasses = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider";

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-24">
      {/* Progress Indicator */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 -mx-4 mb-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col flex-1 mr-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase">Form Completion</span>
            <span className="text-xs font-bold text-slate-800">{completionScore}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${completionScore >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(completionScore, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Shortcuts: Cmd+Enter (Submit) | Alt+S (Smart Complete)
        </div>
      </div>

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

      <section className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">{t.quickTemplates}</h3>
          <div className="relative w-full max-w-md">
            <select
              onChange={(e) => {
                applyTemplate(e.target.value);
                e.target.value = ''; // Reset after selection
              }}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-indigo-800 bg-indigo-50 appearance-none font-medium cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>{t.selectTemplate}</option>
              <option value="Clinical Education">{t.clinicalEducation}</option>
              <option value="Adverse Event Report">{t.adverseEventReport}</option>
              <option value="Administrative">{t.administrative}</option>
              <option value="Initial Meeting">{t.initialMeeting}</option>
              <option value="Routine Follow-up">{t.routineFollowUp}</option>
              <option value="Product Launch">{t.productLaunch}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        <OCRScanner onExtracted={handleOcrExtracted} />
      </section>

      <FormGroup title={t.basicDetails} icon="📋">
        {conflictWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-start gap-2 shadow-sm">
            <svg className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <p className="font-bold mb-0.5">Potential Conflict Detected</p>
              <p>An interaction with this HCP on this date has already been logged. Please verify to avoid duplicates.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={labelClasses}>{t.hcpName} <span className="text-red-500">*</span></label>
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
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
                  <>
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
                    <HCPTrendAnalysis history={history} />
                    <HCPInsights hcpName={formState.hcpName} history={history} />
                  </>
                )}
              </div>
            )}
            
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-0">{t.interactionType}</label>
              <button 
                type="button" 
                onClick={handleAutoCategorize}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider"
              >
                Auto Categorize
              </button>
            </div>
            <select
              value={formState.interactionType}
              onChange={(e) => handleChange('interactionType', e.target.value)}
              className={getInputClasses('interactionType')}
            >
              <option value="">{t.selectType}</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className={labelClasses}>{t.date} <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formState.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={getInputClasses('date')}
            />
          </div>
          <div>
            <label className={labelClasses}>{t.time}</label>
            <input
              type="time"
              value={formState.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className={getInputClasses('time')}
            />
          </div>
          <div>
            <label className={labelClasses}>Duration</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="MM:SS"
                value={formState.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className={`${getInputClasses('duration')} flex-1`}
              />
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 rounded-lg text-white text-xs font-bold transition-colors flex items-center justify-center min-w-[70px] ${isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {isTimerRunning ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClasses}>{t.attendees}</label>
          <input
            type="text"
            placeholder={t.attendeesPlaceholder}
            value={formState.attendees}
            onChange={(e) => handleChange('attendees', e.target.value)}
            className={getInputClasses('attendees')}
          />
          <p className="text-[10px] text-slate-500 mt-1">Separate multiple names with commas.</p>
        </div>
      </FormGroup>

      <FormGroup title={t.coreDiscussion} icon="💬">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleSmartComplete}
            disabled={isSmartCompleting}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {isSmartCompleting ? (
              <div className="w-3 h-3 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>✨ AI Smart Complete</span>
            )}
          </button>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{t.topicsDiscussed}</label>
            <span className="text-[10px] text-slate-400 font-mono">{formState.topicsDiscussed.length} chars</span>
          </div>
          <textarea
            placeholder={t.topicsPlaceholder}
            rows={3}
            value={formState.topicsDiscussed}
            onChange={(e) => handleChange('topicsDiscussed', e.target.value)}
            onBlur={handleAnalyzeSentiment}
            className={getInputClasses('topicsDiscussed')}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-slate-500">Include main questions asked and objections raised.</p>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={handleAnalyzeSentiment}
                disabled={isAnalyzingSentiment || !formState.topicsDiscussed}
                className="text-[11px] font-semibold text-purple-600 bg-purple-50 border border-purple-100 hover:bg-purple-100 px-3 py-1.5 rounded-md flex items-center transition-colors shadow-sm disabled:opacity-50"
              >
                <span className="mr-1.5">🧠</span> {isAnalyzingSentiment ? t.analyzingTone : t.analyzeTone}
              </button>
              <button type="button" className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center transition-colors shadow-sm">
                <span className="mr-1.5">🎙️</span> {t.summarizeVoice}
              </button>
            </div>
          </div>
        </div>
      </FormGroup>

      <FormGroup title={t.materialsShared} icon="📦">
        <div className="mb-6">
          <div className="flex items-center justify-between py-2 border-b border-slate-200/60 mb-2">
            <span className="text-sm text-slate-600 font-medium">{t.materialsShared}</span>
            <button className="text-[11px] font-semibold px-2.5 py-1 border border-slate-200 text-slate-600 rounded bg-white hover:bg-slate-50 transition-colors shadow-sm">🔍 Search/Add</button>
          </div>
          <input
            type="text"
            list="materials-options"
            placeholder={t.materialsPlaceholder}
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
          <PDFPreview />
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

      <FormGroup title={t.outcomesNextSteps} icon="🎯">
        <div className={`p-4 -mx-4 rounded-lg transition-all duration-500 mb-6 ${formState.highlightedFields?.includes('sentiment') ? 'bg-green-50 ring-2 ring-green-400/30' : ''}`}>
        <label className={labelClasses}>{t.sentiment}</label>
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
              <span>{sentiment === 'Positive' ? t.positive : sentiment === 'Negative' ? t.negative : t.neutral}</span>
            </label>
          ))}
        </div>
        </div>
        
        <div className="space-y-6">
          <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{t.outcomes}</label>
              <button
                type="button"
                onClick={() => toggleRecording('outcomes')}
                className={`p-1 rounded-full transition-colors ${recordingField === 'outcomes' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title={recordingField === 'outcomes' ? "Stop recording" : "Start voice input"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{formState.outcomes.length} chars</span>
          </div>
          <textarea
            placeholder={t.outcomesPlaceholder}
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
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">{t.followUpActions}</label>
                <button
                  type="button"
                  onClick={() => toggleRecording('followUpActions')}
                  className={`p-1 rounded-full transition-colors ${recordingField === 'followUpActions' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title={recordingField === 'followUpActions' ? "Stop recording" : "Start voice input"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{formState.followUpActions.length} chars</span>
            </div>
            <textarea
              placeholder={t.followUpPlaceholder}
              rows={2}
              value={formState.followUpActions}
              onChange={(e) => handleChange('followUpActions', e.target.value)}
              className={getInputClasses('followUpActions')}
            />
            <p className="text-[10px] text-slate-500 mt-1">Specific tasks to be done before the next meeting.</p>
          </div>
          <div>
            <label className={labelClasses}>{t.followUpDate}</label>
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
            <FollowUpScheduler formState={formState} />
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.executiveSummary}</h3>
            <button
              type="button"
              onClick={() => toggleRecording('executiveSummary')}
              className={`p-1.5 rounded-full transition-colors ${recordingField === 'executiveSummary' ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              title={recordingField === 'executiveSummary' ? "Stop recording" : "Start voice input"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {formState.executiveSummary ? (
              <button
                type="button"
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
              >
                {isSummarizing ? (
                  <>
                     <div className="w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
                     Generating...
                  </>
                ) : (
                  <>🔄 {t.regenerateSummary}</>
                )}
              </button>
            ) : (
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
                  <>✨ {t.generateSentence}</>
                )}
              </button>
            )}
          </div>
        </div>
        
        <textarea
          placeholder={t.executiveSummaryPlaceholder}
          rows={4}
          value={formState.executiveSummary}
          onChange={(e) => handleChange('executiveSummary', e.target.value)}
          className={getInputClasses('executiveSummary')}
        />
      </section>

      <section className="pt-6 mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          {t.print}
        </button>
        <button
          type="button"
          onClick={() => {
            vibrate(50);
            dispatch(resetForm());
            localStorage.removeItem('hcpInteractionDraft');
          }}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          {t.clearForm}
        </button>
        <button
          id="submit-interaction-btn"
          type="button"
          disabled={!formState.hcpName || !formState.date}
          onClick={async () => {
            vibrate([100, 50, 100]); // success pattern
            if (!formState.hcpName || !formState.date) return;
            try {
              const res = await fetch('/api/hcps/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formState),
              });
              const data = await res.json().catch(() => null);
              
              dispatch(resetForm());
              localStorage.removeItem('hcpInteractionDraft');
              setRefreshTrigger(prev => prev + 1);
              
              if (data && data.offline) {
                setToastMessage({ title: 'Offline Mode', message: 'Interaction saved locally. It will sync automatically when you are back online.' });
              } else {
                setToastMessage({ title: 'Success', message: 'Interaction successfully saved to the CRM.' });
              }
              
              setTimeout(() => setToastMessage(null), 4000);
            } catch (error) {
              console.error('Failed to save interaction', error);
              setToastMessage({ title: 'Error', message: 'Failed to save interaction.' });
              setTimeout(() => setToastMessage(null), 4000);
            }
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg ${!formState.hcpName || !formState.date ? 'bg-blue-400 text-white cursor-not-allowed shadow-blue-400/20' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
        >
          {t.submitRecord}
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
