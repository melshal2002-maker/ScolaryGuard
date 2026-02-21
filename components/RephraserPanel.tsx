
import React, { useState } from 'react';
import { RephraseResult } from '../types';

interface Props {
  result: RephraseResult;
}

const RephraserPanel: React.FC<Props> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.rephrased);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-blue-600 px-6 py-3 flex justify-between items-center">
          <h4 className="text-sm font-bold text-white">Humanized Output ({result.style})</h4>
          <button 
            onClick={handleCopy}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors text-xs flex items-center gap-2 border border-white/20"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            {copied ? 'Copied!' : 'Copy Results'}
          </button>
        </div>
        <div className="p-6">
          <div className="prose prose-slate max-w-none">
            <p className="font-serif text-slate-800 leading-relaxed text-lg whitespace-pre-wrap">
              {result.rephrased}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Refinement Summary</h5>
          <p className="text-xs text-slate-600 italic">
            {result.changesSummary}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RephraserPanel;
