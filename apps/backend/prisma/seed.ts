/**
 * Prisma seed script — establishes this project's persistent-state
 * seeding convention (see spec's Assumptions). Run via `npx prisma db seed`.
 *
 * Seeds the fixture user this feature's own contract (and every future
 * F03-F12 contract that needs an authenticated user) can rely on:
 * "Existing User" <existing@example.com> / "ValidPass123".
 *
 * This script intentionally hashes with `bcryptjs` directly (cost 10,
 * matching `HashedPassword`'s own rule) instead of importing the domain
 * layer — seed scripts are standalone tooling, run outside the app process.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIXTURE_USER = {
  name: "Existing User",
  email: "existing@example.com",
  password: "ValidPass123",
};

async function main(): Promise<void> {
  const hashedPassword = await bcrypt.hash(FIXTURE_USER.password, 10);

  await prisma.user.upsert({
    where: { email: FIXTURE_USER.email },
    update: {},
    create: {
      name: FIXTURE_USER.name,
      email: FIXTURE_USER.email,
      hashedPassword,
      isAdmin: false,
      isSuspended: false,
    },
  });

  console.log(`Seeded user: ${FIXTURE_USER.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
