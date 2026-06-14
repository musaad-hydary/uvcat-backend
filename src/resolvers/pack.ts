import type { PrismaClient } from "@prisma/client";

export interface Context {
  prisma: PrismaClient;
  userId: string | undefined;
}

export const packResolvers = {
  Query: {
    packs: async (
      _parent: unknown,
      args: { tag?: string; search?: string },
      ctx: Context,
    ) => {
      return ctx.prisma.pack.findMany({
        where: {
          ...(args.tag ? { tags: { has: args.tag } } : {}),
          ...(args.search
            ? { name: { contains: args.search, mode: "insensitive" } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
      });
    },

    pack: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.pack.findUnique({
        where: { id: args.id },
      });
    },
  },

  Mutation: {
    createPack: async (
      _parent: unknown,
      args: { name: string; description?: string; tags: string[] },
      ctx: Context,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      return ctx.prisma.pack.create({
        data: {
          name: args.name,
          description: args.description,
          tags: args.tags,
          authorId: ctx.userId,
        },
      });
    },

    deletePack: async (
      _parent: unknown,
      args: { id: string },
      ctx: Context,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const pack = await ctx.prisma.pack.findUnique({ where: { id: args.id } });
      if (!pack) throw new Error("Pack not found");
      if (pack.authorId !== ctx.userId) throw new Error("Not authorized");

      await ctx.prisma.pack.delete({ where: { id: args.id } });
      return true;
    },

    incrementDownload: async (
      _parent: unknown,
      args: { packId: string },
      ctx: Context,
    ) => {
      await ctx.prisma.pack.update({
        where: { id: args.packId },
        data: { downloads: { increment: 1 } },
      });
      return true;
    },
  },

  Pack: {
    author: async (
      parent: { authorId: string },
      _args: unknown,
      ctx: Context,
    ) => {
      return ctx.prisma.user.findUnique({ where: { id: parent.authorId } });
    },
    textures: async (parent: { id: string }, _args: unknown, ctx: Context) => {
      return ctx.prisma.texture.findMany({ where: { packId: parent.id } });
    },
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },
};
