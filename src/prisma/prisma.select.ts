import { Prisma } from 'generated/prisma/client';

export const userPublicSelect = {
  id: true,
  email: true,
  githubId: true,
  createdAt: true,
  profile: {
    select: {
      nickname: true,
      avatarUrl: true,
      bio: true,
      dob: true,
    },
  },
} satisfies Prisma.UserSelect;
