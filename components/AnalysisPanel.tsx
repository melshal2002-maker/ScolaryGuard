
import React, { useState } from 'react';
import { DetectionResult } from '../types';
import GitHubSync from './GitHubSync';

interface Props {
  result: DetectionResult;
}

const AnalysisPanel: React.FC<Props> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAnalysis = () => {
    const textToCopy = `Verdict: ${result.verdict}\nScore: ${result.score}%\n\nAnalysis: ${result.analysis}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSyncContent = () => {
    return `# ScholarGuard Forensic Analysis\n\n**Verdict:** ${result.verdict}\n**AI Probability:** ${result.score}%\n\n## Metrics\n- Perplexity: ${result.metrics.perplexity}%\n- Burstiness: ${result.metrics.burstiness}%\n- Complexity: ${result.metrics.complexity}%\n\n## Analysis\n${result.analysis}\n\n## Identified Signatures\n${result.highlights.map(h => `- **${h.level.toUpperCase()} RISK**: "${h.text}" (${h.reason})`).join('\n')}`;
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-emerald-500';
    if (score < 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score < 30) return 'bg-emerald-500';
    if (score < 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <i className="fas fa-microscope text-7xl text-white"></i>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-white font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
                <i className="fas fa-fingerprint text-blue-400"></i>
                Forensic Analysis
              </h3>
              <p className={`text-5xl font-black tracking-tighter ${getScoreColor(result.score)}`}>
                {result.score}%
              </p>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Probability of Machine Generation</span>
            </div>
            <div className="flex items-center gap-4">
              <GitHubSync 
                content={getSyncContent()} 
                defaultFileName={`analysis-${Date.now()}.md`} 
                title="Forensic Analysis Report"
              />
              <button 
                onClick={handleCopyAnalysis}
                className="text-slate-500 hover:text-white transition-colors"
                title="Copy Report"
              >
                <i className={`fas ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
              </button>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-2 mb-8 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${getScoreBg(result.score)} shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
              style={{ width: `${result.score}%` }}
            />
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                result.score < 30 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                result.score < 70 ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                'border-rose-500/30 text-rose-400 bg-rose-500/10'
              }`}>
                {result.verdict}
              </span>
            </div>

            {/* Advanced Metrics Dashboard */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-800/50">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Perplexity</span>
                  <span className="text-[10px] font-bold text-white">{result.metrics.perplexity}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${result.metrics.perplexity}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Burstiness</span>
                  <span className="text-[10px] font-bold text-white">{result.metrics.burstiness}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${result.metrics.burstiness}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Complexity</span>
                  <span className="text-[10px] font-bold text-white">{result.metrics.complexity}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500" style={{ width: `${result.metrics.complexity}%` }}></div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {result.analysis}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex-grow">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Identified Signatures</h4>
        </div>
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
          {result.highlights.map((item, idx) => (
            <div key={idx} className="p-5 hover:bg-slate-50 transition-colors group">
              <p className="text-xs font-serif italic text-slate-800 mb-2 border-l-2 border-slate-200 group-hover:border-blue-400 pl-4 transition-colors">
                "{item.text}"
              </p>
              <div className="flex items-center gap-3">
                <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                  item.level === 'high' ? 'bg-rose-100 text-rose-700' : 
                  item.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.level} RISK
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{item.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
