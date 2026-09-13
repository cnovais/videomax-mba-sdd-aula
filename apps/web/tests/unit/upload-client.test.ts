import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  UploadClient,
  validateFile,
  UNSUPPORTED_FORMAT_MESSAGE,
  FILE_TOO_LARGE_MESSAGE,
} from "@/lib/upload-client";

function makeFile(name: string, sizeBytes: number): File {
  const file = new File([new Uint8Array(Math.min(sizeBytes, 1024))], name);
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("validateFile", () => {
  it("rejects an unsupported extension", () => {
    expect(validateFile(makeFile("notes.txt", 100))).toBe(UNSUPPORTED_FORMAT_MESSAGE);
  });

  it("rejects a file above 2GB", () => {
    expect(validateFile(makeFile("clip.mp4", 2 * 1024 * 1024 * 1024 + 1))).toBe(FILE_TOO_LARGE_MESSAGE);
  });

  it("accepts a valid file within the size limit", () => {
    expect(validateFile(makeFile("clip.mp4", 1024))).toBeNull();
  });
});

/** Minimal controllable fake — records every XHR that actually called send(). */
class FakeXHR {
  static created: FakeXHR[] = [];
  upload = { addEventListener: vi.fn() };
  private listeners: Record<string, Array<() => void>> = {};
  status = 201;
  responseText = "{}";

  addEventListener(event: string, callback: () => void): void {
    (this.listeners[event] ??= []).push(callback);
  }

  open(): void {
    // no-op — url/method not asserted here
  }

  send(): void {
    FakeXHR.created.push(this);
  }

  resolve(status: number, responseText: string): void {
    this.status = status;
    this.responseText = responseText;
    for (const callback of this.listeners["load"] ?? []) callback();
  }
}

describe("UploadClient", () => {
  beforeEach(() => {
    FakeXHR.created = [];
    vi.stubGlobal("XMLHttpRequest", FakeXHR);
  });

  it("rejects an invalid file before sending any request", () => {
    const onRejected = vi.fn();
    const client = new UploadClient({ onRejected, onProgress: vi.fn(), onCompleted: vi.fn(), onFailed: vi.fn() });

    client.enqueue(makeFile("notes.txt", 100));

    expect(onRejected).toHaveBeenCalledWith(expect.anything(), UNSUPPORTED_FORMAT_MESSAGE);
    expect(FakeXHR.created).toHaveLength(0);
  });

  it("queues a second file while the first is uploading", () => {
    const client = new UploadClient({
      onRejected: vi.fn(),
      onProgress: vi.fn(),
      onCompleted: vi.fn(),
      onFailed: vi.fn(),
    });

    client.enqueue(makeFile("first.mp4", 1024));
    client.enqueue(makeFile("second.mp4", 1024));

    // Only the first upload has actually started.
    expect(FakeXHR.created).toHaveLength(1);

    FakeXHR.created[0]?.resolve(201, JSON.stringify({ id: "1", title: "first", status: "validating" }));

    // Completing the first starts the second.
    expect(FakeXHR.created).toHaveLength(2);
  });

  it("assigns a unique id to each enqueue, even for the identical file selected twice", () => {
    // Regression: the queue previously had no per-enqueue identity, so the UI
    // derived a React list key from `name + lastModified`, which collides when
    // the same file is selected twice in quick succession (E2E-UPLOAD-02) and
    // corrupts rendering of the two progress entries.
    const onProgress = vi.fn();
    const client = new UploadClient({ onRejected: vi.fn(), onProgress, onCompleted: vi.fn(), onFailed: vi.fn() });
    const file = makeFile("same.mp4", 1024);

    client.enqueue(file);
    client.enqueue(file);

    const ids = onProgress.mock.calls.map(([progress]) => progress.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("calls onCompleted with the parsed video on success", () => {
    const onCompleted = vi.fn();
    const client = new UploadClient({ onRejected: vi.fn(), onProgress: vi.fn(), onCompleted, onFailed: vi.fn() });

    client.enqueue(makeFile("clip.mp4", 1024));
    FakeXHR.created[0]?.resolve(201, JSON.stringify({ id: "abc", title: "clip", status: "validating" }));

    expect(onCompleted).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: "abc" }));
  });

  it("calls onFailed with the server's error message on failure", () => {
    const onFailed = vi.fn();
    const client = new UploadClient({ onRejected: vi.fn(), onProgress: vi.fn(), onCompleted: vi.fn(), onFailed });

    client.enqueue(makeFile("clip.mp4", 1024));
    FakeXHR.created[0]?.resolve(422, JSON.stringify({ code: "UNSUPPORTED_FORMAT", message: "nope" }));

    expect(onFailed).toHaveBeenCalledWith(expect.anything(), "nope");
  });
});
