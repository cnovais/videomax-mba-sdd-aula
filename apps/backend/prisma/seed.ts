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
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();

const FIXTURE_USER = {
  name: "Existing User",
  email: "existing@example.com",
  password: "ValidPass123",
  isAdmin: false,
};

/** Admin fixture account. */
const ADMIN_USER = {
  name: "Existing Admin",
  email: "admin@example.com",
  password: "ValidPass123",
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
  await seedUser({ name: "Second Admin", email: "second-admin@example.com", password: "ValidPass123", isAdmin: true });
  await seedUser({ name: "Suspend Target", email: "suspend-target@example.com", password: "ValidPass123", isAdmin: false });
  await seedUser({ name: "Delete Target", email: "delete-target@example.com", password: "ValidPass123", isAdmin: false });
  await seedUser({ name: "Searchable Sam", email: "searchable.sam@example.com", password: "ValidPass123", isAdmin: false });
  for (let index = 1; index <= 50; index += 1) {
    const value = String(index).padStart(3, "0");
    await seedUser({ name: `Bulk User ${value}`, email: `bulk-user-${value}@example.com`, password: "ValidPass123", isAdmin: false });
  }
  const deleteTarget = await prisma.user.findUniqueOrThrow({ where: { email: "delete-target@example.com" } });
  const storageRoot = process.env["STORAGE_ROOT"] ?? "./storage";
  await mkdir(join(storageRoot, "videos"), { recursive: true });
  await mkdir(join(storageRoot, "thumbnails"), { recursive: true });
  await copyFile(join(process.cwd(), "../../video-samples/tiny-valid.mp4"), join(storageRoot, "videos/delete-target-a.mp4"));
  await copyFile(join(process.cwd(), "../../video-samples/tiny-valid.mp4"), join(storageRoot, "videos/delete-target-b.mp4"));
  await copyFile(join(process.cwd(), "../../video-samples/tiny-valid.mp4"), join(storageRoot, "thumbnails/delete-target-a.jpg"));
  await prisma.video.deleteMany({ where: { userId: deleteTarget.id } });
  await prisma.video.createMany({ data: [
    { userId: deleteTarget.id, title: "Delete Target Clip A", originalFilename: "a.mp4", storageKey: "videos/delete-target-a.mp4", sizeBytes: 100, durationSeconds: 3, containerFormat: "mp4", status: "ready", thumbnailPath: "thumbnails/delete-target-a.jpg" },
    { userId: deleteTarget.id, title: "Delete Target Clip B", originalFilename: "b.mp4", storageKey: "videos/delete-target-b.mp4", sizeBytes: 100, durationSeconds: 3, containerFormat: "mp4", status: "validating" },
  ] });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
