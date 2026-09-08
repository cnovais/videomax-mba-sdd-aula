import type { ThumbnailGateway } from "@/domain/video/thumbnail.gateway";

/** Fake for tests — configurable success/failure; never shells out. */
export class FakeThumbnailGateway implements ThumbnailGateway {
  constructor(private readonly shouldSucceed = true) {}

  extract(_videoPath: string, _durationSeconds: number, _outputPath: string): Promise<{ sizeBytes: number } | null> {
    return Promise.resolve(this.shouldSucceed ? { sizeBytes: 1024 } : null);
  }
}
