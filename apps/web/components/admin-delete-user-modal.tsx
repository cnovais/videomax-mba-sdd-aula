"use client";

import { useState } from "react";

type AdminDeleteUserModalProps = {
  user: { id: string; name: string; email: string };
  onClose: () => void;
  onDeleted: () => void;
};

export function AdminDeleteUserModal({
  user,
  onClose,
  onDeleted,
}: AdminDeleteUserModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfirmed = confirmation === user.email;

  async function deleteUser(): Promise<void> {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmEmail: confirmation }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(payload?.message ?? "Unable to delete this user");
      setIsDeleting(false);
      return;
    }

    onDeleted();
  }

  return (
    <div
      aria-label="Delete user confirmation"
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-vm-lg">
        <h2 className="text-xl font-semibold">Delete {user.name}?</h2>
        <p className="mt-3 text-sm text-muted">
          Type <strong>{user.email}</strong> to permanently delete this account and its videos.
        </p>
        <label className="mt-5 block text-sm font-medium" htmlFor="delete-confirmation">
          Confirmation email
        </label>
        <input
          id="delete-confirmation"
          aria-label="Confirmation email"
          className="mt-2 w-full rounded border border-line p-3"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
        />
        {error && <p className="mt-3 text-sm text-err">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded border border-line px-4 py-2" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            className="rounded bg-err px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={deleteUser}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
