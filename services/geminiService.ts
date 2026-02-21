
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult, RephraseResult, AcademicStyle, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const detectAIContent = async (text: string): Promise<DetectionResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the following text for linguistic markers of AI generation (LLMs). 
    Focus on:
    1. Perplexity: The randomness and complexity of the text.
    2. Burstiness: The variation in sentence length and structure.
    3. Complexity: The sophistication of vocabulary and syntax.
    4. Lack of unique human anecdotal markers.
    
    Provide a probability score (0-100, where 100 is definitely AI), a structural breakdown, and specific metrics (0-100) for perplexity, burstiness, and complexity.
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          verdict: { type: Type.STRING },
          analysis: { type: Type.STRING },
          metrics: {
            type: Type.OBJECT,
            properties: {
              perplexity: { type: Type.NUMBER, description: "0-100 score for text randomness" },
              burstiness: { type: Type.NUMBER, description: "0-100 score for sentence variation" },
              complexity: { type: Type.NUMBER, description: "0-100 score for syntactic sophistication" }
            },
            required: ["perplexity", "burstiness", "complexity"]
          },
          highlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                reason: { type: Type.STRING },
                level: { type: Type.STRING }
              },
              required: ["text", "reason", "level"]
            }
          }
        },
        required: ["score", "verdict", "analysis", "metrics", "highlights"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return data as DetectionResult;
};

export const humanizeContent = async (text: string, style: AcademicStyle, riskLevel: RiskLevel): Promise<RephraseResult> => {
  const intensityMap = {
    [RiskLevel.CONSERVATIVE]: "Keep the tone professional. Slightly vary the sentence lengths. Use standard academic words.",
    [RiskLevel.BALANCED]: "Rewrite for clarity. Use shorter, direct sentences. Replace 40% of the complex verbs with simpler, active alternatives. Avoid AI-sounding transitions.",
    [RiskLevel.AGGRESSIVE]: "Total structural reset. Write like a human expert who values clarity for a global audience. Use basic but precise scientific English. Break machine patterns completely."
  };

  const styleGuides = {
    [AcademicStyle.HEURISTIC_SCIENTIFIC]: "Explain the logic clearly. Use 'we' if appropriate. Use words that a scientist would use in a clear presentation. Avoid sounding like a machine generated summary.",
    [AcademicStyle.SCIENTIFIC]: "Focus on directness. Use 'show', 'test', 'find', and 'result'. Avoid 'elucidate', 'necessitate', or 'commence'. Make the science the focus, not the big words.",
    [AcademicStyle.HUMANITIES]: "Focus on the argument. Use simple words to explain deep ideas. Write as if you are teaching an advanced student in their second language.",
    [AcademicStyle.NARRATIVE]: "Make it a story of discovery. Use varied sentence lengths. Use human-centric language (e.g., 'In our lab...', 'We noticed...').",
    [AcademicStyle.FORMAL]: "Professional but not stiff. Be clear. Use direct verbs. No academic fluff.",
    [AcademicStyle.CONCISE]: "Say it in the simplest way possible. No unnecessary words."
  };

  const budgetMap = {
    [RiskLevel.CONSERVATIVE]: 2000,
    [RiskLevel.BALANCED]: 8000,
    [RiskLevel.AGGRESSIVE]: 24000
  };

  const maxTokensMap = {
    [RiskLevel.CONSERVATIVE]: 4000,
    [RiskLevel.BALANCED]: 12000,
    [RiskLevel.AGGRESSIVE]: 32000
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a professional editor for top scientific journals. Your goal is to rewrite the provided text to pass AI detection by sounding 100% human and accessible to a global audience.

    CORE PRINCIPLE: "Expert Simplicity". Human experts write clearly. AI models write with "sophisticated fluff".
    
    SPECIFIC RULES:
    1. ACCESSIBLE SCIENTIFIC ENGLISH: Use words familiar to non-native English speakers. Use "Main" instead of "Pivotal", "Whole" instead of "Holistic", "Strong" instead of "Robust", "Study" instead of "Delve into".
    2. NO AI BUZZWORDS: Strictly avoid: tapestry, multifaceted, underscores, meticulously, transformative, realm, fostering, leverage, synergistic, or comprehensive.
    3. SENTENCE RHYTHM: Create extreme variation in sentence length. Follow a long 20-word sentence with a short 5-word sentence. This "burstiness" is a key human marker.
    4. ACTIVE VOICE: Use active, direct phrasing (e.g., "The data shows..." or "We observed...") rather than passive, heavy machine phrasing.
    5. PROFESSIONAL TONE: Do not be casual, but be simple. Use precise but common scientific nouns.
    6. PRESERVE TERMINOLOGY: Do NOT change scientific terms, technical jargon, or abbreviations (e.g., DNA, CRISPR, mRNA, etc.). Keep them exactly as they appear in the original text.
    
    STYLE: ${styleGuides[style]}
    INTENSITY: ${intensityMap[riskLevel]}

    Text to humanize: "${text}"`,
    config: {
      maxOutputTokens: maxTokensMap[riskLevel],
      thinkingConfig: { thinkingBudget: budgetMap[riskLevel] },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rephrased: { type: Type.STRING },
          changesSummary: { type: Type.STRING },
          estimatedBypassScore: { 
            type: Type.NUMBER,
            description: "Predicted probability (0-100) that this will bypass AI detectors."
          }
        },
        required: ["rephrased", "changesSummary", "estimatedBypassScore"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    original: text,
    rephrased: data.rephrased,
    style,
    riskLevel,
    changesSummary: data.changesSummary,
    estimatedBypassScore: data.estimatedBypassScore
  };
};
