// export type BinaryLabel = 0 | 1;

// export interface AnalyzeResponse {
//   tokens: string[];
//   labels: BinaryLabel[];  // 0 = normal, 1 = obf
//   scores: number[];       // confidence 0..1
//   obf_tokens: string[];
//   risk_score: number;     // 0..100
// }


//  export interface AnalyzeResponse {
//   verdict: "Safe" | "Suspicious" | "Malicious";
//   score: number;
//   indicators: string[];
// }

export type AnalyzeResponse = {
  tokens: string[];
  labels: number[];
  scores: number[];
  obf_tokens: string[];
  risk_score: number;
  meta?: {
    classical_label?: number;
    classical_score?: number;
    bert_label?: number;
    bert_score?: number;
    final_label?: number;
    final_score?: number;
  };
};