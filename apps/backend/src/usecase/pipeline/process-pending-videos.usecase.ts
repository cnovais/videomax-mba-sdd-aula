import type { VideoQueries } from "@/domain/video/video.queries";
import type { ProcessPendingVideosInput, ProcessPendingVideosOutput } from "./process-pending-videos.dto";
import type { RunVideoStageUseCase } from "./run-video-stage.usecase";
export class ProcessPendingVideosUseCase {
  constructor(private readonly queries: VideoQueries, private readonly runStage: RunVideoStageUseCase, private readonly concurrency: number) {}
  async execute(input: ProcessPendingVideosInput | Date = {}): Promise<ProcessPendingVideosOutput> {
    const now = input instanceof Date ? input : input.now ?? new Date();
    const videos = await this.queries.findDue(this.concurrency, now);
    await Promise.all(videos.map((video) => this.runStage.execute(video)));
  }
}
