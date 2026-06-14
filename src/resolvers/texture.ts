import type { Context } from "./pack.js";
import {
  uploadTexture as uploadToStorage,
  deleteTexture as deleteFromStorage,
} from "../lib/storage.js";

export const textureResolvers = {
  Mutation: {
    uploadTexture: async (
      _parent: unknown,
      args: { packId: string; name: string; file: File },
      ctx: Context,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const pack = await ctx.prisma.pack.findUnique({
        where: { id: args.packId },
      });
      if (!pack) throw new Error("Pack not found");
      if (pack.authorId !== ctx.userId) throw new Error("Not authorized");

      const { url } = await uploadToStorage(args.file, args.packId);

      return ctx.prisma.texture.create({
        data: {
          name: args.name,
          url,
          packId: args.packId,
        },
      });
    },

    deleteTexture: async (
      _parent: unknown,
      args: { id: string },
      ctx: Context,
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const texture = await ctx.prisma.texture.findUnique({
        where: { id: args.id },
        include: { pack: true },
      });
      if (!texture) throw new Error("Texture not found");
      if (texture.pack.authorId !== ctx.userId)
        throw new Error("Not authorized");

      const bucketMarker = "/object/public/";
      const idx = texture.url.indexOf(bucketMarker);
      if (idx !== -1) {
        const fullPath = texture.url.slice(idx + bucketMarker.length);
        const path = fullPath.split("/").slice(1).join("/");
        await deleteFromStorage(path);
      }

      await ctx.prisma.texture.delete({ where: { id: args.id } });
      return true;
    },
  },
};
