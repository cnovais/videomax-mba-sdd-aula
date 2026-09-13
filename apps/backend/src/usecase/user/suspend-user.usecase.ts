import type {UserRepository} from "@/domain/user/user.repository";import type {SessionRepository} from "@/domain/session/session.repository";import {SelfAdminActionError,UserNotFoundError} from "@/domain/user/errors";import {requireAdminActor} from "./require-admin-actor.dto";
export class SuspendUserUseCase {
  constructor(private readonly users: UserRepository, private readonly sessions: SessionRepository) {}
  async execute(i:{actorId?:string;targetUserId:string}) { const actor=await requireAdminActor(this.users,i.actorId); if(actor.id===i.targetUserId) throw new SelfAdminActionError(); const target=await this.users.findById(i.targetUserId); if(!target) throw new UserNotFoundError(i.targetUserId); await this.users.save(target.suspend()); await this.sessions.deleteAllByUserId(target.id); return {id:target.id,isSuspended:true}; }
}
