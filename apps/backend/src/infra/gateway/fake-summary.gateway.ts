import type { SummaryGateway, SummaryResult } from "@/domain/video/summary.gateway";
export class FakeSummaryGateway implements SummaryGateway {
  constructor(private readonly result: SummaryResult | Error = { overview: "Example overview", keyTopics: ["Example topic"] }) {}

  async summarize(_transcript: string): Promise<SummaryResult> {
    if (this.result instanceof Error) return Promise.reject(this.result);
    return Promise.resolve(this.result);
  }
}
