import type { VideoQueries } from "@/domain/video/video.queries";
import type { RunVideoStageUseCase } from "./run-video-stage.usecase";
export class ProcessPendingVideosUseCase { constructor(private readonly queries: VideoQueries, private readonly runStage: RunVideoStageUseCase, private readonly concurrency: number) {} async execute(now = new Date()): Promise<void> { const videos = await this.queries.findDue(this.concurrency, now); await Promise.all(videos.map((video) => this.runStage.execute(video))); } }
