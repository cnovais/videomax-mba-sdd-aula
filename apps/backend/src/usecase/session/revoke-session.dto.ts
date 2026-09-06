export type RevokeSessionInput = {
  /** The bearer token presented by the caller. Undefined when no cookie/header was sent. */
  token: string | undefined;
};
