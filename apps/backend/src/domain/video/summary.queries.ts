import type { Summary } from "./summary.entity";
export interface SummaryQueries { findByVideoId(videoId: string): Promise<Summary | null>; }
