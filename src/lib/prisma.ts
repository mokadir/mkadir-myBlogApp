import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // During build time (e.g., Docker build, Vercel build), DATABASE_URL may not be available.
  // Return a mock client that gracefully handles queries instead of crashing.
  if (!process.env.DATABASE_URL) {
    return createMockPrismaClient();
  }

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return client;
}

function createMockPrismaClient(): PrismaClient {
  // Create a proxy that intercepts all model property access and query method calls
  // and returns empty/default results. This allows the app to build successfully
  // without a database connection.
  const modelHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      if (prop === "then" || prop === "catch") return undefined;

      // Return an async function that returns empty results for any query method
      return async () => {
        const method = String(prop);
        if (method === "count" || method === "aggregate") return 0;
        if (method === "findMany" || method === "groupBy") return [];
        if (method === "create" || method === "update" || method === "upsert" || method === "delete" || method === "createMany" || method === "updateMany" || method === "deleteMany") {
          return {};
        }
        // findUnique, findFirst, findFirstOrThrow, findUniqueOrThrow
        return null;
      };
    },
  };

  const clientHandler: ProxyHandler<object> = {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      if (prop === "then" || prop === "catch" || prop === "constructor") return undefined;

      // Handle PrismaClient methods
      if (["$connect", "$disconnect", "$on", "$use", "$transaction"].includes(String(prop))) {
        return async () => undefined;
      }

      // For any model access (e.g., prisma.post, prisma.user), return a model proxy
      return new Proxy({}, modelHandler);
    },
  };

  return new Proxy({}, clientHandler) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
