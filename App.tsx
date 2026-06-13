
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HumanizerPanel from './components/HumanizerPanel';
import ProtocolChecklist from './components/ProtocolChecklist';
import { humanizeContent } from './services/geminiService';
import { AnalysisState, AcademicStyle, RiskLevel, RephraseResult } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AcademicStyle>(AcademicStyle.SCIENTIFIC);
  const [loadingMsg, setLoadingMsg] = useState('Initializing engines...');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [lmStudioStatus, setLmStudioStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => {
    return localStorage.getItem('lmStudioUrl') || 'http://localhost:1234';
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const [state, setState] = useState<AnalysisState>({
    isDetecting: false,
    isRephrasing: false,
    isDetectingOutput: false,
    result: null,
    outputDetectionResult: null,
    rephrasedContent: null,
    error: null,
    riskLevel: RiskLevel.BALANCED,
  });

  const fetchModels = async (overrideUrl?: string) => {
    const urlToUse = overrideUrl !== undefined ? overrideUrl : lmStudioUrl;
    setLmStudioStatus('loading');
    try {
      const res = await fetch(`/api/lmstudio/models?url=${encodeURIComponent(urlToUse)}`);
      if (!res.ok) throw new Error('Unreachable');
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setModels(data.data);
        if (data.data.length > 0) {
          setSelectedModel(data.data[0].id);
          setLmStudioStatus('connected');
          setState(prev => ({ ...prev, error: null }));
          localStorage.setItem('lmStudioUrl', urlToUse);
        } else {
          setLmStudioStatus('error');
          setState(prev => ({ ...prev, error: `LM Studio connected at ${urlToUse} but no active models were found loaded. Please load a model weight inside LM Studio.` }));
        }
      } else {
        setLmStudioStatus('error');
      }
    } catch (e: any) {
      setLmStudioStatus('error');
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const detectionMessages = [
    "Checking machine signatures...",
    "Looking at rhythm patterns...",
    "Scanning word choices...",
    "Analyzing sentence flow...",
    "Running forensic check..."
  ];

  const humanizationMessages = [
    "Cleaning machine patterns...",
    "Simplifying vocabulary...",
    "Adjusting rhythm and flow...",
    "Removing AI buzzwords...",
    "Applying human voice filter...",
    "Verifying global readability..."
  ];

  useEffect(() => {
    let interval: any;
    if (state.isDetecting || state.isDetectingOutput) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingMsg(detectionMessages[i % detectionMessages.length]);
        i++;
      }, 1500);
    } else if (state.isRephrasing) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingMsg(humanizationMessages[i % humanizationMessages.length]);
        i++;
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [state.isDetecting, state.isRephrasing, state.isDetectingOutput]);

  const handleDetect = async () => {
    // Detection disabled to save API quota
    return;
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    if (lmStudioStatus !== 'connected' || !selectedModel) {
      setState(prev => ({ 
        ...prev, 
        error: `Cannot humanize: No LM Studio model is connected. Make sure LM Studio is running on your machine, has a model loaded, and click the refresh button. Connection Address: ${lmStudioUrl}` 
      }));
      return;
    }

    setState(prev => ({ ...prev, isRephrasing: true, error: null, rephrasedContent: null, outputDetectionResult: null }));
    
    // Create a timeout promise (extended to 180 seconds for slow local GPU/CPU generation)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out after 180 seconds')), 180000)
    );

    try {
      const rephrasedContent = await Promise.race([
        humanizeContent(inputText, selectedStyle, state.riskLevel, selectedModel, lmStudioUrl),
        timeoutPromise
      ]) as RephraseResult;
      
      setState(prev => ({ ...prev, isRephrasing: false, rephrasedContent }));
    } catch (err: any) {
      const isTimeout = err.message?.toLowerCase().includes('deadline') || 
                        err.message?.toLowerCase().includes('timeout');
      setState(prev => ({ 
        ...prev, 
        isRephrasing: false, 
        error: isTimeout 
          ? 'Neural engine timed out. Make sure your local GPU is accelerated, or use a smaller GGUF quantization (e.g. Q4_K_M).' 
          : `Humanization Error: ${err.message || 'Failed to process text.'}`
      }));
    }
  };

  const handleDetectOutput = async () => {
    // Detection disabled to save API quota
    return;
  };

  const setRiskLevel = (riskLevel: RiskLevel) => {
    setState(prev => ({ ...prev, riskLevel }));
  };

  const clearAll = () => {
    setInputText('');
    setState(prev => ({
      ...prev,
      isDetecting: false,
      isRephrasing: false,
      isDetectingOutput: false,
      result: null,
      outputDetectionResult: null,
      rephrasedContent: null,
      error: null,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      
      {deferredPrompt && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between sticky top-16 z-40 animate-in slide-in-from-top duration-300 shadow-xl">
          <div className="flex items-center gap-3">
            <i className="fas fa-download text-blue-400 text-xs"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Install ScholarGuard Portable Terminal</span>
          </div>
          <button 
            onClick={handleInstall}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg"
          >
            Install
          </button>
        </div>
      )}

      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Protocol Bar */}
        <div className="animate-in fade-in duration-500">
          <ProtocolChecklist state={state} inputLength={inputText.length} />
        </div>

        {/* Action Tray */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bypass Strength</h3>
              <div className="flex gap-1">
                {Object.values(RiskLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRiskLevel(level)}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      state.riskLevel === level 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden sm:block mx-2"></div>

            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Style</h3>
              <div className="relative">
                <select 
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as AcademicStyle)}
                  className="appearance-none bg-slate-50 text-slate-700 text-[9px] font-black uppercase tracking-widest py-2 pl-4 pr-8 rounded-xl focus:outline-none border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  {Object.values(AcademicStyle).map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <i className="fas fa-chevron-down text-[7px]"></i>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden sm:block mx-2"></div>

            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                Local Model
                {lmStudioStatus === 'connected' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="LM Studio Connected"></span>
                ) : lmStudioStatus === 'loading' ? (
                  <i className="fas fa-spinner fa-spin text-blue-500 text-[8px]" title="Scanning connection..."></i>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="LM Studio Offline"></span>
                )}
              </h3>
              <div className="flex items-center gap-1.5">
                {lmStudioStatus === 'connected' ? (
                  <div className="relative">
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none bg-slate-50 text-slate-700 text-[9px] font-black uppercase tracking-widest py-2 pl-4 pr-8 rounded-xl focus:outline-none border border-slate-200 hover:border-blue-300 transition-colors max-w-[150px] truncate"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.id}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <i className="fas fa-chevron-down text-[7px]"></i>
                    </div>
                  </div>
                ) : lmStudioStatus === 'loading' ? (
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest py-2">Scanning...</div>
                ) : (
                  <div className="text-[9px] text-rose-500 font-black uppercase tracking-widest py-2">Offline</div>
                )}
                
                <button 
                  onClick={() => fetchModels()}
                  disabled={lmStudioStatus === 'loading'}
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-colors flex items-center justify-center active:scale-95 disabled:opacity-50"
                  title="Rescan LM Studio Models"
                >
                  <i className="fas fa-arrows-rotate text-[8px]"></i>
                </button>
                
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-xl border text-slate-500 transition-colors flex items-center justify-center active:scale-95 ${
                    showSettings ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="LM Studio Connection Settings"
                >
                  <i className="fas fa-gear text-[8px]"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={clearAll}
              className="bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              Clear Terminal
            </button>
            <button 
              onClick={handleHumanize}
              disabled={state.isDetecting || state.isRephrasing || !inputText.trim()}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95"
            >
              {state.isRephrasing ? <i className="fas fa-dna fa-spin"></i> : <i className="fas fa-bolt-lightning"></i>}
              Humanize Sequence
            </button>
          </div>
        </div>

        {/* Connection Settings panel toggle */}
        {showSettings && (
          <div className="bg-slate-100/50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex-grow space-y-2">
              <span className="font-black uppercase tracking-widest text-slate-500 text-[10px]">LM Studio Connection URL</span>
              <div className="flex items-center gap-2 max-w-lg">
                <input 
                  type="text" 
                  value={lmStudioUrl}
                  onChange={(e) => setLmStudioUrl(e.target.value)}
                  placeholder="http://localhost:1234"
                  className="bg-white text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-grow text-xs font-mono shadow-sm"
                />
                <button 
                  onClick={() => fetchModels(lmStudioUrl)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-md shadow-blue-100"
                >
                  <i className="fas fa-plug text-[9px]"></i>
                  Connect
                </button>
              </div>
            </div>
            <div className="md:max-w-md text-[10px] text-slate-500 bg-white p-3.5 rounded-2xl border border-slate-200/50 leading-relaxed shadow-sm">
              <p className="font-black text-slate-700 uppercase tracking-widest text-[9px] mb-1 flex items-center gap-1">
                <i className="fas fa-globe text-blue-500"></i>
                Connecting via Google Cloud Preview
              </p>
              <p>
                Since the ScholarGuard preview is running in the cloud, its backend server cannot directly contact <code className="bg-slate-50 px-1 py-0.5 rounded text-[9px] font-mono text-slate-600">localhost</code> on your PC. 
              </p>
              <p className="mt-1">
                To connect: run an ngrok tunnel (e.g. <code className="bg-slate-50 px-1 py-0.5 rounded text-[9px] font-mono text-slate-600">ngrok http 1234</code>), then paste the secure public <code className="text-blue-600 font-bold">https://...</code> tunnel URL above!
              </p>
            </div>
          </div>
        )}

        {/* Workspace Grid - Force side-by-side from 'md' breakpoint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Input Terminal */}
          <div className="flex flex-col space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full group focus-within:ring-4 focus-within:ring-blue-100/50 transition-all">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    Neural Input Terminal
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[8px] border flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-200 max-w-[200px] truncate" title={selectedModel || "LM Studio"}>
                      {selectedModel ? `LM Studio: ${selectedModel}` : "LM Studio"}
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{inputText.length} chars</div>
                </div>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste text for detection or accessible humanization..."
                className="w-full h-[400px] md:h-[550px] lg:h-[650px] p-6 sm:p-8 focus:outline-none resize-none font-serif text-slate-900 leading-relaxed text-lg sm:text-xl bg-white placeholder:text-slate-300 flex-grow"
              />
            </div>

            {state.error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in">
                <i className="fas fa-shield-exclamation text-rose-500"></i>
                {state.error}
              </div>
            )}
          </div>

          {/* Right Column: Output / Analysis Terminal */}
          <div className="flex flex-col h-full space-y-4">
            {state.isDetecting || state.isRephrasing || state.isDetectingOutput ? (
              <div className="bg-white border border-slate-200 rounded-3xl h-full flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
                  <i className={`fas ${state.isRephrasing ? 'fa-dna' : 'fa-satellite-dish'} text-2xl text-blue-600 animate-spin-slow`}></i>
                </div>
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-widest mb-2">{loadingMsg}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Applying expert clarity filter</p>
              </div>
            ) : (
              <div className="h-full">
                <HumanizerPanel 
                  result={state.rephrasedContent} 
                  onVerify={handleDetectOutput}
                  isVerifying={state.isDetectingOutput}
                  detectionResult={state.outputDetectionResult}
                  onClear={clearAll}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <i className="fas fa-scroll text-slate-400"></i>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
               ScholarGuard Professional Portable v2.0
             </p>
          </div>
          <div className="flex gap-6">
             <a href="#" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Forensic Status</a>
             <a href="#" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Neural Safety</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
