export type ResolveSessionInput = {
  token: string;
};

export type ResolveSessionOutput = {
  id: string;
  isAdmin: boolean;
};
