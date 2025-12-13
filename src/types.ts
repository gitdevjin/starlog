export interface JwtPayload {
  sub: string;
  email: string;
  type: string;
  iat?: number; // issued at (auto-added by JWT)
  exp?: number; // expiration (auto-added by JWT)
  nbf?: number; // not before (optional)
}
