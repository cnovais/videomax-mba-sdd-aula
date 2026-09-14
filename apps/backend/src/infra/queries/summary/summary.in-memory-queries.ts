import type { SummaryQueries } from "@/domain/video/summary.queries";
import type { SummaryRepository } from "@/domain/video/summary.repository";
export class SummaryInMemoryQueries implements SummaryQueries { constructor(private readonly repo: SummaryRepository) {} findByVideoId(id: string) { return this.repo.findByVideoId(id); } }
