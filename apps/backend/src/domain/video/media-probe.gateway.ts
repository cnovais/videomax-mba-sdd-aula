export interface MediaProbeGateway {
  /** Probes the file at `path` for its exact duration, in whole seconds. */
  probe(path: string): Promise<{ durationSeconds: number; isReadable: boolean; hasSupportedCodecs: boolean }>;
}
