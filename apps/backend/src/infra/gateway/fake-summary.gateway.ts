import type { SummaryGateway, SummaryResult } from "@/domain/video/summary.gateway";
export class FakeSummaryGateway implements SummaryGateway { constructor(private readonly result: SummaryResult = { overview: "Example overview", keyTopics: ["Example topic"] }) {} summarize(_transcript: string) { return Promise.resolve(this.result); } }
