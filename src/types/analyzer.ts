export type BinaryLabel = 0 | 1;

export interface AnalyzeResponse {
  tokens: string[];
  labels: BinaryLabel[];  // 0 = normal, 1 = obf
  scores: number[];       // confidence 0..1
  obf_tokens: string[];
  risk_score: number;     // 0..100
}
