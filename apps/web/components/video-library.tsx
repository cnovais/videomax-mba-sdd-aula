"use client";
import { useState } from "react";
import { UploadClient, type UploadProgress } from "@/lib/upload-client";
import { UploadDropzone } from "@/components/upload-dropzone";
import { UploadProgressCard } from "@/components/upload-progress-card";
import { VideoList } from "@/components/video-list";
import { Toast } from "@/components/toast";
import { deleteVideo, updateVideo, updateViewMode, type VideoItem, type VideoSort } from "@/lib/video-client";
export function VideoLibrary({ initialVideos, initialViewMode = "grid" }: { initialVideos: VideoItem[]; initialViewMode?: "grid" | "list" }) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [sort, setSort] = useState<VideoSort>("recent");
  const [toast, setToast] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Map<File, UploadProgress>>(new Map());
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<VideoItem | null>(null);
  const [descriptionText, setDescriptionText] = useState("");
  const [deleting, setDeleting] = useState<VideoItem | null>(null);
  const [deleteReady, setDeleteReady] = useState(false);
  const [client] = useState(() => new UploadClient({ onRejected: (_f, m) => setToast(m), onProgress: (p) => setUploads((x) => new Map(x).set(p.file, p)), onCompleted: (_f, v) => setVideos((x) => [v as VideoItem, ...x]), onFailed: (_f, m) => setToast(m) }));
  async function saveTitle(): Promise<void> {
    if (!editing) return;
    if (!title.trim()) {
      setToast("Title cannot be empty");
      return;
    }
    const response = await updateVideo(editing.id, { title });
    if (!response.ok) {
      setToast("Title cannot be empty");
      return;
    }
    const result = (await response.json()) as { title: string };
    setVideos((items) => items.map((video) => video.id === editing.id ? { ...video, title: result.title } : video));
    setEditing(null);
  }

  async function saveDescription(): Promise<void> {
    if (!description) return;
    const response = await updateVideo(description.id, { description: descriptionText });
    if (response.ok) {
      setVideos((items) => items.map((video) => video.id === description.id ? { ...video, description: descriptionText } : video));
      setDescription(null);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (!deleting || !deleteReady) return;
    const id = deleting.id;
    const response = await deleteVideo(id);
    if (response.ok) setVideos((items) => items.filter((video) => video.id !== id));
    setDeleting(null);
  }

  function openRename(video: VideoItem): void { setEditing(video); setTitle(video.title); }
  function openDescription(video: VideoItem): void { setDescription(video); setDescriptionText(video.description); }
  function openDelete(video: VideoItem): void { setDeleting(video); setDeleteReady(false); setTimeout(() => setDeleteReady(true), 1000); }

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10"><UploadDropzone onFilesSelected={(files) => Array.from(files).forEach((file) => client.enqueue(file))} />{uploads.size > 0 && <div data-testid="upload-queue">{Array.from(uploads.values()).map((progress) => <UploadProgressCard key={progress.id} progress={progress} />)}</div>}<div className="flex items-center justify-between"><div className="flex gap-2"><button type="button" aria-label="Grid view" onClick={() => { setViewMode("grid"); void updateViewMode("grid"); }}>Grid</button><button type="button" aria-label="List view" onClick={() => { setViewMode("list"); void updateViewMode("list"); }}>List</button></div><label>Sort <select value={sort} onChange={(event) => setSort(event.target.value as VideoSort)}><option value="recent">Most recent</option><option value="oldest">Oldest</option><option value="title">Title</option></select></label></div><VideoList videos={videos} viewMode={viewMode} onRename={openRename} onDescription={openDescription} onDelete={openDelete} />{editing && <div role="dialog" aria-label="Rename video"><p>Rename video</p><input aria-label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />{!title.trim() && <p>Title cannot be empty</p>}<button type="button" onClick={() => void saveTitle()}>Save</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>}{description && <div role="dialog" aria-label="Edit description"><p>Edit description</p><textarea aria-label="Description" value={descriptionText} onChange={(event) => setDescriptionText(event.target.value)} /><button type="button" onClick={() => void saveDescription()}>Save</button><button type="button" onClick={() => setDescription(null)}>Cancel</button></div>}{deleting && <div role="dialog"><p>{`Delete '${deleting.title}'? This cannot be undone.`}</p><button type="button" disabled={!deleteReady} onClick={() => void confirmDelete()}>Delete</button><button type="button" onClick={() => setDeleting(null)}>Cancel</button></div>}{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}</div>;
}
