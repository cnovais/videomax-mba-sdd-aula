import type {UserRepository} from "@/domain/user/user.repository";import type {UserQueries} from "@/domain/user/user.queries";import {requireAdminActor} from "./require-admin-actor.dto";
export class ListUsersForAdminUseCase {
  constructor(private readonly queries: UserQueries, private readonly repo: UserRepository) {}
  execute(i: {actorId?: string; page:number; pageSize:number; search?:string; sortBy?:string; sortDir?:"asc"|"desc"}) { return requireAdminActor(this.repo, i.actorId).then(() => this.queries.listForAdmin(i)); }
}
