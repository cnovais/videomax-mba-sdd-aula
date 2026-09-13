import { UserNotFoundError } from "@/domain/user/errors";
import type { UserRepository } from "@/domain/user/user.repository";
import { type SetLibraryViewModeInput, type SetLibraryViewModeOutput } from "./set-library-view-mode.dto";
export class SetLibraryViewModeUseCase {
  constructor(private readonly userRepo: UserRepository) {}
  async execute(input: SetLibraryViewModeInput): Promise<SetLibraryViewModeOutput> {
    const user = await this.userRepo.findById(input.actorId); if (!user) throw new UserNotFoundError(input.actorId);
    const updated = user.changeLibraryViewMode(input.viewMode); await this.userRepo.save(updated); return { libraryViewMode: updated.libraryViewMode };
  }
}
