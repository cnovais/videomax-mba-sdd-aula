import type { PrismaClient } from "@prisma/client";
import type { AdminUserListInput, UserQueries } from "@/domain/user/user.queries";
export class UserPrismaQueries implements UserQueries {
  constructor(private readonly prisma: PrismaClient) {}
  async listForAdmin(input: AdminUserListInput) {
    const where = input.search ? { OR: [{ name: { contains: input.search, mode: "insensitive" as const } }, { email: { contains: input.search, mode: "insensitive" as const } }] } : {};
    const sort = input.sortBy === "videoCount" ? { videos: { _count: input.sortDir ?? "desc" } } : input.sortBy === "status" ? { isSuspended: input.sortDir ?? "desc" } : { [input.sortBy ?? "createdAt"]: input.sortDir ?? "desc" };
    const [rows, total] = await Promise.all([this.prisma.user.findMany({ where, include: { _count: { select: { videos: true } } }, orderBy: sort, skip: (input.page - 1) * input.pageSize, take: input.pageSize }), this.prisma.user.count({ where })]);
    return { items: rows.map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, lastLoginAt: (u as typeof u & {lastLoginAt?: Date|null}).lastLoginAt ?? null, videoCount: (u as typeof u & {_count:{videos:number}})._count.videos, isSuspended: u.isSuspended, isAdmin: u.isAdmin })), page: input.page, pageSize: input.pageSize, total };
  }
  countAll(): Promise<number> { return this.prisma.user.count(); }
  countAdmins(): Promise<number> { return this.prisma.user.count({ where: { isAdmin: true } }); }
}
