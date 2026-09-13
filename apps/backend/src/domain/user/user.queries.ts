import type { PageInput, PageOutput } from "@/domain/_shared/pagination";

export type AdminUserListItem = { id: string; name: string; email: string; createdAt: Date; lastLoginAt: Date | null; videoCount: number; isSuspended: boolean; isAdmin: boolean };
export type AdminUserListInput = PageInput & { search?: string; sortBy?: string; sortDir?: "asc" | "desc" };
export interface UserQueries { listForAdmin(input: AdminUserListInput): Promise<PageOutput<AdminUserListItem>>; countAll(): Promise<number>; countAdmins(): Promise<number>; }
