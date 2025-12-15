export interface JwtPayload {
  sub: string;
  email: string;
  type: string;
  iat?: number; // issued at (auto-added by JWT)
  exp?: number; // expiration (auto-added by JWT)
  nbf?: number; // not before (optional)
}

export type UserEntity = {
  id: string;
  email: string;
  password: string;
  githubId?: string;
  createdAt: Date;
  profile?: ProfileEntity;
};

export type ProfileEntity = {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dob?: Date;
};
