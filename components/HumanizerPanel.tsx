
import React, { useState } from 'react';
import { RephraseResult, DetectionResult } from '../types';

interface Props {
  result?: RephraseResult | null;
  onVerify?: () => void;
  isVerifying?: boolean;
  detectionResult?: DetectionResult | null;
  onClear?: () => void;
}

const HumanizerPanel: React.FC<Props> = ({ result, onVerify, isVerifying, detectionResult, onClear }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rephrased);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = result?.rephrased.trim() ? result.rephrased.trim().split(/\s+/).length : 0;

  const getBypassColor = (score: number) => {
    if (score > 85) return 'text-emerald-500';
    if (score > 60) return 'text-blue-500';
    return 'text-amber-500';
  };

  const getDetectionScoreColor = (score: number) => {
    if (score < 20) return 'text-emerald-600';
    if (score < 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="h-full flex flex-col animate-in slide-in-from-right duration-500">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col flex-grow">
        {/* Header section with styling match */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fas fa-shield-halved text-white text-[10px]"></i>
            </div>
            <div>
              <h4 className="text-[9px] font-black text-blue-400 tracking-widest uppercase mb-0.5">Adversarial Output</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white tracking-tight uppercase">{result?.style || 'Awaiting Input'}</span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">{wordCount} words</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <span className={`text-xl font-black tracking-tighter ${result ? getBypassColor(result.estimatedBypassScore) : 'text-slate-700'}`}>
                 {result ? `${result.estimatedBypassScore}%` : '--%'}
               </span>
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">Human Confidence</span>
            </div>
          </div>
        </div>
        
        {/* Main scrollable text area */}
        <div className="flex-grow p-6 sm:p-8 overflow-y-auto bg-white">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <i className="fas fa-terminal text-slate-300"></i>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Neural Sequence</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none">
              <p className="font-serif text-slate-900 leading-[1.8] text-lg sm:text-xl whitespace-pre-wrap selection:bg-blue-100 selection:text-blue-900">
                {result.rephrased}
              </p>
            </div>
          )}
        </div>

        {/* Verification result (conditionally shown) */}
        {detectionResult && (
          <div className="bg-slate-50 border-y border-slate-100 p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-microscope text-slate-400 text-[10px]"></i>
                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Internal Post-Scan</h5>
              </div>
              <div className={`text-[10px] font-black ${getDetectionScoreColor(detectionResult.score)} uppercase tracking-widest`}>
                {detectionResult.score}% AI Detected
              </div>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full mb-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${detectionResult.score > 40 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${detectionResult.score}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight font-medium italic">
              {detectionResult.verdict}: {detectionResult.analysis}
            </p>
          </div>
        )}

        {/* Control Footer */}
        <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/20">
          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              {onClear && (
                <button 
                  onClick={onClear}
                  className="bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={handleCopy}
                disabled={!result}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black active:scale-95 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                {copied ? 'Copied' : 'Copy Output'}
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-white border border-slate-100">
            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fas fa-dna text-indigo-500"></i>
              Shift Analysis
            </h5>
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium italic">
              {result?.changesSummary || 'Analysis will be generated upon humanization...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanizerPanel;
