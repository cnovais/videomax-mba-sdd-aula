export type VideoSort = "recent" | "oldest" | "title";
export type VideoItem = { id: string; title: string; description: string; status: string; thumbnailUrl: string | null; sizeBytes: number; durationSeconds: number; uploadedAt: string };
export async function updateVideo(id: string, body: { title?: string; description?: string }): Promise<Response> { return fetch(`/api/videos/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); }
export async function deleteVideo(id: string): Promise<Response> { return fetch(`/api/videos/${id}`, { method: "DELETE" }); }
export async function updateViewMode(viewMode: "grid" | "list"): Promise<Response> { return fetch("/api/library-view-mode", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ viewMode }) }); }
