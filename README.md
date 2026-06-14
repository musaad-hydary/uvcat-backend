# UVCAT Backend

GraphQL API for UVCAT Multiplayer, the community texture pack sharing feature of [UVCAT](https://github.com/musaad-hydary/uvcat).

## What it does

- GitHub OAuth login with signed JWT sessions
- Create, browse, search, and delete texture packs
- Upload texture images to Supabase Storage
- Track download counts per pack

## Stack

- GraphQL via graphql-yoga, with built in multipart file upload support
- Prisma ORM with Postgres, hosted on Supabase
- Supabase Storage for texture files
- GitHub OAuth for sign in

## Data model

- **User** - created on first GitHub login
- **Pack** - a collection of textures with name, description, tags, and download count
- **Texture** - a single image stored on Supabase, linked to a pack

## Running locally

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Server runs at `http://localhost:4000`, GraphQL playground at `/graphql`.

## API

```graphql
type Query {
  packs(tag: String, search: String): [Pack!]!
  pack(id: ID!): Pack
  me: User
}

type Mutation {
  createPack(name: String!, description: String, tags: [String!]!): Pack!
  deletePack(id: ID!): Boolean!
  incrementDownload(packId: ID!): Boolean!
  uploadTexture(packId: ID!, name: String!, file: File!): Texture!
  deleteTexture(id: ID!): Boolean!
}
```

`uploadTexture` uses the GraphQL multipart request spec. Allowed types are PNG, JPEG, and WebP, with a 5MB limit per file.

## Deployment

Deployed on Render, with Postgres and storage on Supabase. The frontend is on Vercel at [github.com/musaad-hydary/uvcat](https://github.com/musaad-hydary/uvcat).
