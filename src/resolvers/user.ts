import type { Context } from "./pack.js";

export const userResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: Context) => {
      if (!ctx.userId) return null;
      return ctx.prisma.user.findUnique({ where: { id: ctx.userId } });
    },
  },

  User: {
    packs: async (parent: { id: string }, _args: unknown, ctx: Context) => {
      return ctx.prisma.pack.findMany({
        where: { authorId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },
};
