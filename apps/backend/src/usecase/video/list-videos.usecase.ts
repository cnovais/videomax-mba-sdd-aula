import type { VideoQueries } from "@/domain/video/video.queries";
import { type ListVideosInputWithSort, type ListVideosOutput, toItemOutput } from "./list-videos.dto";

export class ListVideosUseCase {
  constructor(private readonly videoQueries: VideoQueries) {}

  async execute(input: ListVideosInputWithSort): Promise<ListVideosOutput> {
    const page = await this.videoQueries.listByUser(input.actorId, {
      page: input.page,
      pageSize: input.pageSize,
    }, input.sort ?? "recent");

    return { ...page, items: page.items.map(toItemOutput) };
  }
}
