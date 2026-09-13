import type { Summary } from "./summary.entity";
export interface SummaryRepository { findByVideoId(videoId: string): Promise<Summary | null>; save(summary: Summary): Promise<void>; }
