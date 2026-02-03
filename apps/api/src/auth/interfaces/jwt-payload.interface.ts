export interface JwtPayload {
  sub: string; // userId
  email: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  isRefresh: true;
}
