
import React from 'react';
import { AnalysisState } from '../types';

interface Props {
  state: AnalysisState;
  inputLength: number;
}

const ProtocolChecklist: React.FC<Props> = ({ state, inputLength }) => {
  const steps = [
    {
      id: 1,
      label: 'Acquisition',
      isComplete: inputLength > 20,
      isActive: inputLength <= 20
    },
    {
      id: 2,
      label: 'Diagnosis',
      isComplete: !!state.result,
      isActive: inputLength > 20 && !state.result
    },
    {
      id: 3,
      label: 'Persona',
      isComplete: !!state.rephrasedContent,
      isActive: !!state.result && !state.rephrasedContent
    },
    {
      id: 4,
      label: 'Reconstruction',
      isComplete: !!state.rephrasedContent,
      isActive: !!state.result && !state.rephrasedContent
    },
    {
      id: 5,
      label: 'Validation',
      isComplete: !!state.outputDetectionResult,
      isActive: !!state.rephrasedContent && !state.outputDetectionResult
    },
    {
      id: 6,
      label: 'Extraction',
      isComplete: !!state.outputDetectionResult,
      isActive: !!state.outputDetectionResult && state.outputDetectionResult.score < 30
    }
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px] px-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 flex-1 ${step.isComplete ? 'opacity-40' : 'opacity-100'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                step.isComplete 
                  ? 'bg-blue-500 border-blue-500 scale-90' 
                  : step.isActive 
                    ? 'bg-blue-900 border-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.5)]' 
                    : 'border-slate-700'
              }`}>
                {step.isComplete ? (
                  <i className="fas fa-check text-[10px] text-white"></i>
                ) : (
                  <span className={`text-[9px] font-black ${step.isActive ? 'text-blue-200' : 'text-slate-600'}`}>{step.id}</span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                step.isComplete ? 'text-slate-500' : step.isActive ? 'text-blue-400' : 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-[0.5] flex items-center justify-center px-1">
                <div className={`h-[1px] w-full transition-colors duration-500 ${step.isComplete ? 'bg-blue-500/30' : 'bg-slate-800'}`}></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProtocolChecklist;
