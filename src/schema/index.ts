import { createSchema } from "graphql-yoga";
import { typeDefs } from "./typeDefs.js";
import { packResolvers } from "../resolvers/pack.js";
import { userResolvers } from "../resolvers/user.js";

const resolvers = {
  Query: {
    ...packResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...packResolvers.Mutation,
  },
  Pack: packResolvers.Pack,
  User: userResolvers.User,
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});
