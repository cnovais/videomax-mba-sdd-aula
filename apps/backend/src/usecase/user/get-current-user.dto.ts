export type GetCurrentUserInput = {
  actorId: string;
};

export type GetCurrentUserOutput = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  libraryViewMode: "grid" | "list";
};
