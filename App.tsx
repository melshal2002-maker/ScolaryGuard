
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnalysisPanel from './components/AnalysisPanel';
import HumanizerPanel from './components/HumanizerPanel';
import ProtocolChecklist from './components/ProtocolChecklist';
import { detectAIContent, humanizeContent } from './services/geminiService';
import { AnalysisState, AcademicStyle, RiskLevel, DetectionResult, RephraseResult } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AcademicStyle>(AcademicStyle.SCIENTIFIC);
  const [loadingMsg, setLoadingMsg] = useState('Initializing engines...');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
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
    if (!inputText.trim()) return;
    setState(prev => ({ ...prev, isDetecting: true, error: null, result: null }));
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Detection timed out after 45 seconds')), 45000)
    );

    try {
      const result = await Promise.race([
        detectAIContent(inputText),
        timeoutPromise
      ]) as DetectionResult;
      
      setState(prev => ({ ...prev, isDetecting: false, result }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isDetecting: false, 
        error: `Detection error: ${err.message || 'The engine encountered an unexpected issue.'}` 
      }));
    }
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    setState(prev => ({ ...prev, isRephrasing: true, error: null, rephrasedContent: null, outputDetectionResult: null }));
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out after 60 seconds')), 60000)
    );

    try {
      const rephrasedContent = await Promise.race([
        humanizeContent(inputText, selectedStyle, state.riskLevel),
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
          ? 'Neural engine timed out. Try the "Conservative" intensity for faster processing.' 
          : `Humanization Error: ${err.message || 'Failed to process text.'}`
      }));
    }
  };

  const handleDetectOutput = async () => {
    if (!state.rephrasedContent) return;
    setState(prev => ({ ...prev, isDetectingOutput: true, error: null }));
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Verification timed out after 45 seconds')), 45000)
    );

    try {
      const result = await Promise.race([
        detectAIContent(state.rephrasedContent.rephrased),
        timeoutPromise
      ]) as DetectionResult;
      
      setState(prev => ({ ...prev, isDetectingOutput: false, outputDetectionResult: result }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isDetectingOutput: false, 
        error: `Output analysis error: ${err.message || 'Verification failed.'}` 
      }));
    }
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

        {/* Workspace Grid - Force side-by-side from 'md' breakpoint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Left Column: Input Terminal */}
          <div className="flex flex-col space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full group focus-within:ring-4 focus-within:ring-blue-100/50 transition-all">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Neural Input Terminal</h2>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inputText.length} chars</div>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste text for detection or accessible humanization..."
                className="w-full h-[400px] md:h-[550px] lg:h-[650px] p-6 sm:p-8 focus:outline-none resize-none font-serif text-slate-900 leading-relaxed text-lg sm:text-xl bg-white placeholder:text-slate-300"
              />
              
              <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/20">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detection Bypass Strength</h3>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{state.riskLevel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(RiskLevel).map((level) => (
                      <button
                        key={level}
                        onClick={() => setRiskLevel(level)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          state.riskLevel === level 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDetect}
                      disabled={state.isDetecting || state.isRephrasing || !inputText.trim()}
                      className="flex-1 sm:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                    >
                      {state.isDetecting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microscope"></i>}
                      Detect
                    </button>
                    <button 
                      onClick={clearAll}
                      className="text-slate-400 hover:text-slate-900 p-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <select 
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value as AcademicStyle)}
                        className="w-full sm:w-auto appearance-none bg-white text-slate-700 text-[10px] font-black uppercase tracking-widest py-3 pl-5 pr-10 rounded-2xl focus:outline-none border border-slate-200 hover:border-blue-300 transition-colors shadow-sm"
                      >
                        {Object.values(AcademicStyle).map(style => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <i className="fas fa-chevron-down text-[8px]"></i>
                      </div>
                    </div>
                    <button 
                      onClick={handleHumanize}
                      disabled={state.isDetecting || state.isRephrasing || !inputText.trim()}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95"
                    >
                      {state.isRephrasing ? <i className="fas fa-dna fa-spin"></i> : <i className="fas fa-bolt-lightning"></i>}
                      Humanize
                    </button>
                  </div>
                </div>
              </div>
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
            ) : state.rephrasedContent ? (
              <div className="h-full">
                <HumanizerPanel 
                  result={state.rephrasedContent} 
                  onVerify={handleDetectOutput}
                  isVerifying={state.isDetectingOutput}
                  detectionResult={state.outputDetectionResult}
                />
              </div>
            ) : state.result ? (
              <div className="h-full">
                <AnalysisPanel result={state.result} />
              </div>
            ) : (
              <div className="flex-grow bg-slate-100/30 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                   <i className="fas fa-globe text-slate-300 text-xl"></i>
                 </div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Awaiting Neural Sequence</h4>
                 <p className="text-[10px] text-slate-300 font-medium max-w-xs uppercase tracking-tight">Detection and High-Clarity Bypass Output will appear here</p>
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
