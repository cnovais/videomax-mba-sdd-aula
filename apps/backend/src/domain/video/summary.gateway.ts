export type SummaryResult = { overview: string; keyTopics: string[] };
export interface SummaryGateway { summarize(transcript: string): Promise<SummaryResult>; }
