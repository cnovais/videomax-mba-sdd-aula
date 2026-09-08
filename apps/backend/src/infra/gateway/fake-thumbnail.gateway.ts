import { Readable } from "node:stream";
import type { ThumbnailGateway } from "@/domain/video/thumbnail.gateway";
import type { InMemoryVideoStorageGateway } from "./in-memory-video-storage.gateway";

const FAKE_JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); // minimal JPEG SOI+EOI markers

/**
 * Fake for tests — configurable success/failure; never shells out.
 *
 * When paired with an `InMemoryVideoStorageGateway` (same instance the
 * use case's storage gateway uses), a "successful" extraction actually
 * writes fake bytes through it, so a subsequent `storage.readStream(key)`
 * — e.g. via `GetVideoThumbnailUseCase` — resolves instead of throwing.
 * Real production gateways share this read-after-write property
 * naturally (both operate on the same disk); the in-memory fakes need
 * this explicit wiring since they are otherwise independent fakes.
 */
export class FakeThumbnailGateway implements ThumbnailGateway {
  constructor(
    private readonly shouldSucceed = true,
    private readonly storage?: InMemoryVideoStorageGateway,
  ) {}

  async extract(
    _videoPath: string,
    _durationSeconds: number,
    outputPath: string,
  ): Promise<{ sizeBytes: number } | null> {
    if (!this.shouldSucceed) return null;
    if (this.storage) {
      const key = outputPath.replace(/^in-memory:\/\//, "");
      await this.storage.store(Readable.from(FAKE_JPEG_BYTES), key);
    }
    return { sizeBytes: FAKE_JPEG_BYTES.length };
  }
}
