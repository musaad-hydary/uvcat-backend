import "dotenv/config";
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema/index.js";
import { prisma } from "./lib/prisma.js";
import {
  getGitHubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGitHubProfile,
} from "./lib/auth.js";
import {
  createSessionCookie,
  getUserIdFromCookieHeader,
  clearSessionCookie,
} from "./lib/session.js";

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CALLBACK_URL = `http://localhost:${PORT}/auth/github/callback`;

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
  context: async ({ request }) => {
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("Cookie header:", cookieHeader);
    const userId = getUserIdFromCookieHeader(cookieHeader);
    console.log("Resolved userId:", userId);
    return { prisma, request, userId };
  },
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/auth/github") {
    const authorizeUrl = getGitHubAuthorizeUrl(CALLBACK_URL);
    res.writeHead(302, { Location: authorizeUrl });
    res.end();
    return;
  }

  if (url.pathname === "/auth/github/callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("Missing code");
      return;
    }

    try {
      const accessToken = await exchangeCodeForToken(code, CALLBACK_URL);
      const profile = await fetchGitHubProfile(accessToken);

      const user = await prisma.user.upsert({
        where: { githubId: String(profile.id) },
        update: { username: profile.login, avatar: profile.avatar_url },
        create: {
          githubId: String(profile.id),
          username: profile.login,
          avatar: profile.avatar_url,
        },
      });

      const cookie = createSessionCookie(user.id);
      console.log("Setting cookie:", cookie);
      res.writeHead(302, {
        Location: FRONTEND_URL,
        "Set-Cookie": cookie,
      });
      res.end();
    } catch (err) {
      console.error("OAuth error:", err);
      res.writeHead(500);
      res.end("Authentication failed");
    }
    return;
  }

  if (url.pathname === "/auth/logout") {
    res.writeHead(302, {
      Location: FRONTEND_URL,
      "Set-Cookie": clearSessionCookie(),
    });
    res.end();
    return;
  }

  yoga(req, res);
});

server.listen(PORT, () => {
  console.log(`UVCAT backend running at http://localhost:${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`Login route: http://localhost:${PORT}/auth/github`);
});
