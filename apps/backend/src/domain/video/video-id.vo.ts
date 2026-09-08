import { Id } from "@/domain/_shared/id.vo";

export class VideoId extends Id {
  static generate(): VideoId {
    return new VideoId(Id.generateValue());
  }

  static from(value: string): VideoId {
    return new VideoId(value);
  }
}
