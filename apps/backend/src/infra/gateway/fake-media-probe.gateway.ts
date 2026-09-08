import type { MediaProbeGateway } from "@/domain/video/media-probe.gateway";

/** Fake for tests — returns a fixed, configurable duration; never shells out. */
export class FakeMediaProbeGateway implements MediaProbeGateway {
  constructor(private readonly durationSeconds = 42) {}

  probe(_path: string): Promise<{ durationSeconds: number }> {
    return Promise.resolve({ durationSeconds: this.durationSeconds });
  }
}
