export interface ThumbnailGateway {
  /**
   * Extracts a frame at ~10% of `durationSeconds` into the video at
   * `videoPath`, storing it under `key`. Returns `null` on any extraction
   * failure (e.g. no video stream to extract from) — this is a best-effort
   * step per the PRD's "otherwise valid file" fallback, never a thrown error.
   */
  extract(videoPath: string, durationSeconds: number, key: string): Promise<{ sizeBytes: number } | null>;
}
