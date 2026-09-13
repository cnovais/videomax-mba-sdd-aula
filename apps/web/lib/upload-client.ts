// Exported so the drop zone's file-picker `accept` attribute and helper
// text derive from this one list instead of restating it.
export const ACCEPTED_EXTENSIONS = ["mp4", "mov", "mkv", "webm", "avi"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB — matches the backend's own limit

export const UNSUPPORTED_FORMAT_MESSAGE = "Only MP4, MOV, MKV, WEBM, and AVI files are supported";
export const FILE_TOO_LARGE_MESSAGE = "Files must be at most 2GB";

export type UploadState = "queued" | "uploading" | "done" | "error";

export type UploadProgress = {
  /** Unique per enqueue call — lets the UI key a list of these by identity even
   * when the same file (same name + lastModified) is selected more than once. */
  id: string;
  file: File;
  loaded: number;
  total: number;
  state: UploadState;
  errorMessage?: string;
};

export type UploadedVideo = {
  id: string;
  title: string;
  status: string;
  thumbnailUrl: string | null;
  sizeBytes: number;
  durationSeconds: number;
  uploadedAt: string;
};

export type UploadClientCallbacks = {
  /** A file failed the client-side extension/size check — no request was sent. */
  onRejected: (file: File, message: string) => void;
  onProgress: (progress: UploadProgress) => void;
  onCompleted: (file: File, video: UploadedVideo) => void;
  onFailed: (file: File, message: string) => void;
};

/** Validates extension and size before any transfer starts (PRD: reject immediately). */
export function validateFile(file: File): string | null {
  const dotIndex = file.name.lastIndexOf(".");
  const extension = dotIndex === -1 ? "" : file.name.slice(dotIndex + 1).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(extension)) return UNSUPPORTED_FORMAT_MESSAGE;
  if (file.size > MAX_FILE_SIZE_BYTES) return FILE_TOO_LARGE_MESSAGE;
  return null;
}

/**
 * Single-flight upload queue: one `XMLHttpRequest` in flight at a time
 * (per PRD: "single-file upload at a time... queues it and starts after
 * the current one finishes"). `XMLHttpRequest`, not `fetch`, because only
 * it exposes `upload.onprogress` in the browsers this product targets.
 */
/** A file waiting in the single-flight queue, tagged with a unique id so two
 * enqueues of the identical file (same name + lastModified) stay distinguishable. */
type QueuedFile = { id: string; file: File };

function createUploadId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class UploadClient {
  private readonly queue: QueuedFile[] = [];
  private uploading = false;

  constructor(private readonly callbacks: UploadClientCallbacks) {}

  enqueue(file: File): void {
    const rejection = validateFile(file);
    if (rejection) {
      this.callbacks.onRejected(file, rejection);
      return;
    }
    const id = createUploadId();
    this.queue.push({ id, file });
    this.callbacks.onProgress({ id, file, loaded: 0, total: file.size, state: "queued" });
    this.processNext();
  }

  private processNext(): void {
    if (this.uploading) return;
    const next = this.queue.shift();
    if (!next) return;
    this.uploading = true;
    this.upload(next);
  }

  private upload({ id, file }: QueuedFile): void {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("video", file, file.name);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      this.callbacks.onProgress({ id, file, loaded: event.loaded, total: event.total, state: "uploading" });
    });

    xhr.addEventListener("load", () => {
      this.uploading = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        this.callbacks.onCompleted(file, JSON.parse(xhr.responseText) as UploadedVideo);
      } else {
        this.callbacks.onFailed(file, parseErrorMessage(xhr.responseText));
      }
      this.processNext();
    });

    xhr.addEventListener("error", () => {
      this.uploading = false;
      this.callbacks.onFailed(file, "Upload interrupted — retry");
      this.processNext();
    });

    xhr.open("POST", "/api/videos");
    xhr.send(formData);
  }
}

function parseErrorMessage(responseText: string): string {
  try {
    const body = JSON.parse(responseText) as { message?: string };
    return body.message ?? "Upload failed — please try again";
  } catch {
    return "Upload failed — please try again";
  }
}
