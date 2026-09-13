export class Summary {
  private constructor(readonly videoId: string, readonly overview: string, readonly keyTopics: string[]) {}
  static create(props: { videoId: string; overview: string; keyTopics: string[] }): Summary { return new Summary(props.videoId, props.overview, props.keyTopics); }
}
