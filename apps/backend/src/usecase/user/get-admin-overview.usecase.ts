import type { UserRepository } from "@/domain/user/user.repository";
import type { UserQueries } from "@/domain/user/user.queries";
import type { VideoQueries } from "@/domain/video/video.queries";
import { requireAdminActor } from "./require-admin-actor.dto";
import type { GetAdminOverviewInput, GetAdminOverviewOutput } from "./get-admin-overview.dto";
export class GetAdminOverviewUseCase {
  constructor(private readonly users: UserQueries, private readonly videos: VideoQueries, private readonly repo: UserRepository) {}
  async execute(i: GetAdminOverviewInput): Promise<GetAdminOverviewOutput> { await requireAdminActor(this.repo, i.actorId); const [totalUsers, totalVideos] = await Promise.all([this.users.countAll(), this.videos.countAll()]); return { totalUsers, totalVideos }; }
}
