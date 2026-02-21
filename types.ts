
export enum AcademicStyle {
  SCIENTIFIC = 'Scientific/Technical',
  HEURISTIC_SCIENTIFIC = 'Heuristic Scientific',
  HUMANITIES = 'Critical Humanities',
  NARRATIVE = 'Academic Narrative',
  FORMAL = 'Formal Executive',
  CONCISE = 'Scholarly Concise'
}

export enum RiskLevel {
  CONSERVATIVE = 'Conservative',
  BALANCED = 'Balanced',
  AGGRESSIVE = 'Aggressive'
}

export interface DetectionResult {
  score: number; // 0-100 (100 is high AI probability)
  verdict: 'Human-Written' | 'Likely AI' | 'Highly Likely AI';
  analysis: string;
  metrics: {
    perplexity: number; // 0-100 (Higher = more complex/human-like)
    burstiness: number; // 0-100 (Higher = more variation/human-like)
    complexity: number; // 0-100 (Higher = more sophisticated)
  };
  highlights: {
    text: string;
    reason: string;
    level: 'low' | 'medium' | 'high';
  }[];
}

export interface RephraseResult {
  original: string;
  rephrased: string;
  style: AcademicStyle;
  riskLevel: RiskLevel;
  changesSummary: string;
  estimatedBypassScore: number; // 0-100 (100 is highly likely to pass as human)
}

export interface AnalysisState {
  isDetecting: boolean;
  isRephrasing: boolean;
  isDetectingOutput: boolean;
  result: DetectionResult | null;
  outputDetectionResult: DetectionResult | null;
  rephrasedContent: RephraseResult | null;
  error: string | null;
  riskLevel: RiskLevel;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
}
