import { Prisma } from 'generated/prisma/client';

export const UserPublicSelect = {
  id: true,
  email: true,
  githubId: true,
  createdAt: true,
  stargate: {
    select: {
      starname: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      dob: true,
    },
  },
} satisfies Prisma.UserSelect;
