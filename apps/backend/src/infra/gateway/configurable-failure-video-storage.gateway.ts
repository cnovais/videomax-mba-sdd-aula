import type { Readable } from "node:stream";
import type { VideoStorageGateway } from "@/domain/video/video-storage.gateway";

/** Decorates storage so evaluator/runtime fixtures can simulate delete failure. */
export class ConfigurableFailureVideoStorageGateway implements VideoStorageGateway {
  private readonly failureKeys: Set<string>;

  constructor(private readonly delegate: VideoStorageGateway, configuredKeys: string) {
    this.failureKeys = new Set(configuredKeys.split(",").map((key) => key.trim()).filter(Boolean));
  }

  armDeleteFailure(key: string): void { this.failureKeys.add(key); }

  store(content: Readable, key: string): Promise<{ sizeBytes: number }> { return this.delegate.store(content, key); }
  readStream(key: string): Readable { return this.delegate.readStream(key); }
  pathFor(key: string): string { return this.delegate.pathFor(key); }

  async delete(key: string): Promise<void> {
    if (this.failureKeys.has(key)) throw new Error(`Configured storage delete failure for key "${key}"`);
    await this.delegate.delete(key);
  }
}
