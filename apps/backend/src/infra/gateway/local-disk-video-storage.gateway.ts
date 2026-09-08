import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";

export class LocalDiskVideoStorageGateway implements VideoStorageGateway {
  constructor(private readonly root: string) {}

  async store(content: Readable, key: string): Promise<{ sizeBytes: number }> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });

    let sizeBytes = 0;
    content.on("data", (chunk: Buffer) => {
      sizeBytes += chunk.length;
    });
    await pipeline(content, createWriteStream(path));

    return { sizeBytes };
  }

  readStream(key: string): Readable {
    return createReadStream(this.pathFor(key));
  }

  pathFor(key: string): string {
    return join(this.root, key);
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
