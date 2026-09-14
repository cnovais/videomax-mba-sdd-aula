import type { Summary } from "@/domain/video/summary.entity";
import type { SummaryRepository } from "@/domain/video/summary.repository";
export class SummaryInMemoryRepository implements SummaryRepository { private readonly values = new Map<string, Summary>(); findByVideoId(id: string) { return Promise.resolve(this.values.get(id) ?? null); } save(value: Summary) { this.values.set(value.videoId, value); return Promise.resolve(); } }
