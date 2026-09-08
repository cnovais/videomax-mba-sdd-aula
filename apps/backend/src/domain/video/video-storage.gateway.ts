import type { Readable } from "node:stream";

/**
 * Stream-based, never Buffer-based: uploads run up to 2GB and must never
 * be buffered whole in process memory. See spec's Technical Decisions.
 */
export interface VideoStorageGateway {
  /** Streams `content` to storage under `key`, returning the byte count written. */
  store(content: Readable, key: string): Promise<{ sizeBytes: number }>;
  /** Opens a readable stream over the stored content at `key` (used by the probe/thumbnail gateways). */
  readStream(key: string): Readable;
  /** Absolute filesystem path for `key` — used by gateways that shell out to a CLI tool expecting a path. */
  pathFor(key: string): string;
  delete(key: string): Promise<void>;
}
