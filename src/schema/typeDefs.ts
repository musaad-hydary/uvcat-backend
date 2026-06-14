export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
    avatar: String!
    packs: [Pack!]!
  }

  type Pack {
    id: ID!
    name: String!
    description: String
    tags: [String!]!
    downloads: Int!
    createdAt: String!
    author: User!
    textures: [Texture!]!
  }

  type Texture {
    id: ID!
    name: String!
    url: String!
  }

  type Query {
    packs(tag: String, search: String): [Pack!]!
    pack(id: ID!): Pack
    me: User
  }

  type Mutation {
    createPack(name: String!, description: String, tags: [String!]!): Pack!
    deletePack(id: ID!): Boolean!
    incrementDownload(packId: ID!): Boolean!
  }
`;
