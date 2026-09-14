import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";

/** Fake for tests — returns a fixed, configurable duration; never shells out. */
export class FakeMediaProbeGateway implements MediaProbeGateway {
  constructor(private readonly durationSeconds = 42, private readonly isReadable = true, private readonly hasSupportedCodecs = true) {}

  probe(_path: string): Promise<{ durationSeconds: number; isReadable: boolean; hasSupportedCodecs: boolean }> {
    return Promise.resolve({ durationSeconds: this.durationSeconds, isReadable: this.isReadable, hasSupportedCodecs: this.hasSupportedCodecs });
  }
}
