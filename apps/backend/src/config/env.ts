import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(4000),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  databaseUrl: z.string().url(),
  sessionSecret: z.string().min(1),
  storageRoot: z.string().default("./storage"),
});

const parsed = schema.safeParse({
  port: process.env["PORT"],
  logLevel: process.env["LOG_LEVEL"],
  databaseUrl: process.env["DATABASE_URL"],
  sessionSecret: process.env["SESSION_SECRET"],
  storageRoot: process.env["STORAGE_ROOT"],
});

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten());
  process.exit(1);
}

export const config = Object.freeze(parsed.data);
