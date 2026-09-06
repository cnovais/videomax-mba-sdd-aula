import { Id } from "@/domain/_shared/id.vo";

export class UserId extends Id {
  static generate(): UserId {
    return new UserId(Id.generateValue());
  }

  static from(value: string): UserId {
    return new UserId(value);
  }
}
