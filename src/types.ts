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
  password?: string;
  githubId?: string;
  createdAt: Date;
  stargate?: StargateEntity;
};

export type PlanetEntity = {
  id: number;
  content: string;
  imageUrls: string[];
  viewCount: number;
  gravityCount: number;
  createdAt: Date;
  creatorId: string;
  user?: UserEntity;
  gravities?: GravityEntity[];
};

export type StargateEntity = {
  starname?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  dob?: Date;
};

export type GravityEntity = {};
