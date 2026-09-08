"use client";

import { useRef, type DragEvent } from "react";
import { vmButtonClasses } from "@/components/vm-button";

/** Drag-and-drop zone plus a file-picker fallback, per PRD's Experience. */
export function UploadDropzone({ onFilesSelected }: { onFilesSelected: (files: FileList) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) onFilesSelected(event.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="rounded-xl border border-dashed border-accent bg-surface px-8 py-14 text-center shadow-[var(--shadow-vm-sm)]"
      data-testid="upload-dropzone"
    >
      <p className="text-lg font-semibold tracking-[-0.02em] text-ink">Drop your video here</p>
      <p className="mt-1.5 max-w-md mx-auto text-sm leading-relaxed text-ink-2">
        Or pick a file from your computer. One file at a time — we queue the rest automatically.
      </p>
      <div className="mt-5">
        <button type="button" onClick={() => inputRef.current?.click()} className={vmButtonClasses("solid", "lg")}>
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.mkv,.webm,.avi"
          className="hidden"
          data-testid="upload-file-input"
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) onFilesSelected(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.04em] text-muted">
        MP4 · MOV · MKV · WEBM · AVI · MAX 2GB
      </p>
    </div>
  );
}
