// ─── GraphQL type definitions ──────────────────────────────────────────────

export const typeDefs = /* GraphQL */ `
  # graphql-yoga provides this scalar automatically for multipart file uploads
  scalar File

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
    "All packs, optionally filtered by tag or search term, newest first."
    packs(tag: String, search: String): [Pack!]!

    "A single pack by id."
    pack(id: ID!): Pack

    "The currently authenticated user, or null if not logged in."
    me: User
  }

  type Mutation {
    "Create a new pack. Requires authentication."
    createPack(name: String!, description: String, tags: [String!]!): Pack!

    "Delete a pack. Requires authentication, must be the pack's author."
    deletePack(id: ID!): Boolean!

    "Increment a pack's download counter. No auth required."
    incrementDownload(packId: ID!): Boolean!

    "Upload a texture file to a pack. Requires authentication, must be the pack's author."
    uploadTexture(packId: ID!, name: String!, file: File!): Texture!

    "Delete a texture from a pack. Requires authentication, must be the pack's author."
    deleteTexture(id: ID!): Boolean!
  }
`;
