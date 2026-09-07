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
  isAdmin: false,
};

/** Admin fixture account. */
const ADMIN_USER = {
  name: "Admin",
  email: "admin@admin.com",
  password: "Admin1234",
  isAdmin: true,
};

async function seedUser(user: typeof FIXTURE_USER): Promise<void> {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      hashedPassword,
      isAdmin: user.isAdmin,
      isSuspended: false,
    },
    create: {
      name: user.name,
      email: user.email,
      hashedPassword,
      isAdmin: user.isAdmin,
      isSuspended: false,
    },
  });

  console.log(`Seeded user: ${user.email}`);
}

async function main(): Promise<void> {
  await seedUser(FIXTURE_USER);
  await seedUser(ADMIN_USER);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
