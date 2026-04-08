import { ChevronUp, Loader, Plus } from "lucide-react";
import { useState } from "react";
import { Button, Input } from "@/common/components/ui";
import { cn } from "@/common/lib/utils";
import type { CreateUserRequest, UserRole } from "../api-types";
import { useActivateUser, useAdminUsers, useCreateUser, useDeleteUser, useSuspendUser } from "../queries";

export function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsers();
  const createUser = useCreateUser();
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();
  const deleteUser = useDeleteUser();

  const [showForm, setShowForm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    try {
      const result = await createUser.mutateAsync(form);
      if (result.token) setNewToken(result.token);
      setForm({ name: "", email: "", role: "user", password: "" });
      setShowForm(false);
    } catch {
      setFormError("Failed to create user.");
    }
  }

  async function handleToggle(id: string, status: "active" | "suspended") {
    setPendingId(id);
    try {
      if (status === "active") {
        await suspendUser.mutateAsync(id);
      } else {
        await activateUser.mutateAsync(id);
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setPendingId(id);
    try {
      await deleteUser.mutateAsync(id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{users.length} user(s)</p>
        <Button onClick={() => setShowForm((v) => !v)} type="button">
          {showForm ? <ChevronUp size={14} /> : <Plus size={14} />}
          New user
        </Button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-border bg-surface-high p-4">
          <h3 className="mb-3 font-medium text-foreground text-sm">Create user</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-muted-foreground text-xs">Name *</label>
              <Input
                className="w-full"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Display name"
                type="text"
                value={form.name}
              />
            </div>
            <div>
              <label className="mb-1 block text-muted-foreground text-xs">Email</label>
              <Input
                className="w-full"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                type="email"
                value={form.email ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-muted-foreground text-xs">Role</label>
              <select
                className="w-full rounded-lg border border-border bg-surface-low px-3 py-2 text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                value={form.role}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-muted-foreground text-xs">Password</label>
              <Input
                className="w-full"
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave empty for token-only"
                type="password"
                value={form.password ?? ""}
              />
            </div>
          </div>
          {formError && <p className="mt-2 text-destructive text-xs">{formError}</p>}
          <div className="mt-3 flex gap-2">
            <Button className="px-4" disabled={createUser.isPending} onClick={handleCreate} type="button">
              {createUser.isPending ? <Loader className="animate-spin" size={14} /> : "Create"}
            </Button>
            <Button className="px-4" onClick={() => setShowForm(false)} type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {newToken && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-muted p-4">
          <p className="mb-1 font-medium text-foreground text-sm">User created — one-time token</p>
          <p className="mb-2 text-muted-foreground text-xs">Save this token now. It will not be shown again.</p>
          <code className="block break-all rounded-md bg-surface-low px-3 py-2 font-mono text-foreground text-xs">
            {newToken}
          </code>
          <button className="mt-2 text-warning text-xs underline" onClick={() => setNewToken(null)} type="button">
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-sm">No users found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b bg-surface-high">
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Email</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Role</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Status</th>
                <th className="px-4 py-3 text-right font-medium text-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-border border-b hover:bg-surface-highest" key={user.id}>
                  <td className="px-4 py-3 font-medium text-foreground text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{user.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium text-xs",
                        user.role === "admin" ? "bg-primary-container text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium text-xs",
                        user.status === "active"
                          ? "bg-success-muted text-success"
                          : "bg-destructive-muted text-destructive"
                      )}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pendingId === user.id ? (
                      <Loader className="ml-auto animate-spin text-muted-foreground" size={14} />
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg border border-border px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
                          onClick={() => handleToggle(user.id, user.status)}
                          type="button"
                        >
                          {user.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          className="rounded-lg border border-destructive/30 px-2.5 py-1 text-destructive text-xs transition-colors hover:bg-destructive-muted"
                          onClick={() => handleDelete(user.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
