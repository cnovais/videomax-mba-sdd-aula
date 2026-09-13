"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDeleteUserModal } from "@/components/admin-delete-user-modal";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  videoCount: number;
  isSuspended: boolean;
  isAdmin: boolean;
};

export function AdminUsersTable({
  items,
  page,
  total,
  pageSize,
}: {
  items: AdminUser[];
  page: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const go = (extra: string) => router.push(`/admin/users?${extra}`);

  async function action(user: AdminUser): Promise<void> {
    await fetch(`/api/admin/users/${user.id}/${user.isSuspended ? "reactivate" : "suspend"}`, {
      method: "POST",
    });
    router.refresh();
  }

  return (
    <div>
      <input
        aria-label="Search users"
        className="mb-5 w-full rounded border border-line p-3"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          go(`search=${encodeURIComponent(event.target.value)}`);
        }}
      />
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-4"><button onClick={() => go("sortBy=name&sortDir=asc")}>Name</button></th>
              <th>Email</th><th>Registered</th><th>Last login</th>
              <th><button onClick={() => go("sortBy=videoCount&sortDir=desc")}>Video count</button></th>
              <th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id} className="border-b border-line">
                <td className="p-4">{user.name}</td><td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td>
                <td>{user.videoCount}</td><td>{user.isSuspended ? "Suspended" : "Active"}</td>
                <td className="flex gap-3 py-4">
                  {!user.isAdmin && (
                    <>
                      <button onClick={() => action(user)}>{user.isSuspended ? "Reactivate" : "Suspend"}</button>
                      <button onClick={() => setDeleteUser(user)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span>Page {page}</span>
        <button disabled={page * pageSize >= total} onClick={() => go(`page=${page + 1}`)}>Next page</button>
      </div>
      {deleteUser && (
        <AdminDeleteUserModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => { setDeleteUser(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
