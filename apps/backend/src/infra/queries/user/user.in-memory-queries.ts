import type { AdminUserListInput, AdminUserListItem, UserQueries } from "@/domain/user/user.queries";
import type { UserInMemoryRepository } from "@/infra/repository/user/user.in-memory-repository";
import type { PageOutput } from "@/domain/_shared/pagination";
import type { VideoInMemoryRepository } from "@/infra/repository/video/video.in-memory-repository";
export class UserInMemoryQueries implements UserQueries {
  constructor(private readonly users: UserInMemoryRepository, private readonly videos: VideoInMemoryRepository) {}
  listForAdmin(input: AdminUserListInput): Promise<PageOutput<AdminUserListItem>> {
    const search = input.search?.toLowerCase(); const all = this.users.all().filter((u) => !search || u.name.toLowerCase().includes(search) || u.email.includes(search));
    const key = input.sortBy ?? "createdAt"; const dir = input.sortDir === "asc" ? 1 : -1;
    all.sort((a, b) => { const av = key === "videoCount" ? this.videos.all().filter((v) => v.userId === a.id).length : key === "status" ? Number(a.isSuspended) : (a as unknown as Record<string, unknown>)[key] as string | Date; const bv = key === "videoCount" ? this.videos.all().filter((v) => v.userId === b.id).length : key === "status" ? Number(b.isSuspended) : (b as unknown as Record<string, unknown>)[key] as string | Date; return (av instanceof Date ? av.getTime() : av > bv ? 1 : av < bv ? -1 : 0) * dir; });
    const start = (input.page - 1) * input.pageSize; const items = all.slice(start, start + input.pageSize).map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, videoCount: this.videos.all().filter((v) => v.userId === u.id).length, isSuspended: u.isSuspended, isAdmin: u.isAdmin }));
    return Promise.resolve({ items, page: input.page, pageSize: input.pageSize, total: all.length });
  }
  countAll(): Promise<number> { return Promise.resolve(this.users.all().length); }
  countAdmins(): Promise<number> { return Promise.resolve(this.users.all().filter((u) => u.isAdmin).length); }
}
