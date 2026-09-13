"use client";

import { useCallback, useEffect, useState } from "react";
import { UploadClient, type UploadProgress, type UploadedVideo } from "@/lib/upload-client";
import { UploadDropzone } from "@/components/upload-dropzone";
import { UploadProgressCard } from "@/components/upload-progress-card";
import { VideoList } from "@/components/video-list";
import { Toast } from "@/components/toast";

const TOAST_DURATION_MS = 5000;

/**
 * Orchestrates the upload queue and the video list together — a new
 * upload's completion must be reflected in the list without a full page
 * reload, and browsing the list must stay usable while an upload runs
 * (PRD: "user can continue browsing the library while the upload is in
 * progress").
 */
export function VideoLibrary({ initialVideos }: { initialVideos: UploadedVideo[] }) {
  const [videos, setVideos] = useState<UploadedVideo[]>(initialVideos);
  const [uploads, setUploads] = useState<Map<File, UploadProgress>>(new Map());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Lazy `useState` initializer (not a ref written during render) — the
  // recommended way to construct a value once and keep it stable across
  // re-renders. Callbacks close over the setState functions, which React
  // guarantees are stable identities.
  const [uploadClient] = useState(
    () =>
      new UploadClient({
        onRejected: (_file, message) => setToastMessage(message),
        onProgress: (progress) => {
          setUploads((prev) => new Map(prev).set(progress.file, progress));
        },
        onCompleted: (file, video) => {
          setUploads((prev) => {
            const next = new Map(prev);
            next.delete(file);
            return next;
          });
          setVideos((prev) => [video, ...prev]);
        },
        onFailed: (file, message) => {
          setUploads((prev) => {
            const next = new Map(prev);
            const existing = next.get(file);
            next.set(file, {
              // `onProgress` always fires before `onFailed` for the same file,
              // so `existing.id` is present; the fallback only guards an
              // otherwise-unreachable ordering.
              id: existing?.id ?? `${file.name}-${file.lastModified}`,
              file,
              loaded: existing?.loaded ?? 0,
              total: existing?.total ?? file.size,
              state: "error",
              errorMessage: message,
            });
            return next;
          });
          setToastMessage(message);
        },
      }),
  );

  const handleFilesSelected = useCallback(
    (files: FileList) => {
      for (const file of Array.from(files)) uploadClient.enqueue(file);
    },
    [uploadClient],
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <UploadDropzone onFilesSelected={handleFilesSelected} />

      {uploads.size > 0 ? (
        <div className="flex flex-col gap-2" data-testid="upload-queue">
          {Array.from(uploads.values()).map((progress) => (
            <UploadProgressCard key={progress.id} progress={progress} />
          ))}
        </div>
      ) : null}

      <VideoList videos={videos} />

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </div>
  );
}
