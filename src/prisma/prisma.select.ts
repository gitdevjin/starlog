import { Prisma } from 'generated/prisma/client';

export const userPublicSelect = {
  id: true,
  email: true,
  githubId: true,
  createdAt: true,
  profile: {
    select: {
      nickname: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      dob: true,
    },
  },
} satisfies Prisma.UserSelect;
