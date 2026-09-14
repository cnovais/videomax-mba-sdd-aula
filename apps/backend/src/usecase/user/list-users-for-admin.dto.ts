import type { PageInput } from "@/domain/_shared/pagination";
export type ListUsersForAdminInput = PageInput & { search?: string; sortBy?: string; sortDir?: "asc" | "desc" };
export type ListUsersForAdminOutput = unknown;
