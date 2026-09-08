import { Readable } from "node:stream";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";

/** LSP-substitutable fake for tests — buffers in memory, no disk I/O. */
export class InMemoryVideoStorageGateway implements VideoStorageGateway {
  private readonly contentByKey = new Map<string, Buffer>();

  async store(content: Readable, key: string): Promise<{ sizeBytes: number }> {
    const chunks: Buffer[] = [];
    for await (const chunk of content) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);
    this.contentByKey.set(key, buffer);
    return { sizeBytes: buffer.length };
  }

  readStream(key: string): Readable {
    const buffer = this.contentByKey.get(key);
    if (!buffer) throw new Error(`InMemoryVideoStorageGateway: no content stored for key "${key}"`);
    return Readable.from(buffer);
  }

  pathFor(key: string): string {
    return `in-memory://${key}`;
  }

  delete(key: string): Promise<void> {
    this.contentByKey.delete(key);
    return Promise.resolve();
  }
}
