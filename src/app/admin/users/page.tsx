import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/session";
import { listUsers, type UserSummary } from "@/lib/users";
import { changeRole } from "./actions";
import { ADMIN_USERS_MESSAGES, isAdminUsersMessageKey } from "./messages";

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const admin = await requireRole("admin");
  const params = await searchParams;
  const message = messageFor(params.message);
  const users = await listUsers();

  return (
    <main className="mx-auto w-full flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Students and admins</h1>
      <p>
        Everyone who has signed up. Each button gives that person the other
        role.{" "}
        <Link href="/admin" className="underline underline-offset-2">
          Progress and results
        </Link>{" "}
        are on their own page.
      </p>
      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-notice-line bg-notice p-3"
        >
          {message}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Signed up</th>
            <th className="py-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isCurrentAdmin={user.id === admin.id}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}

function UserRow({
  user,
  isCurrentAdmin,
}: {
  user: UserSummary;
  isCurrentAdmin: boolean;
}) {
  const nextRole = otherRole(user.role);
  return (
    <tr className="border-b border-line-soft">
      <td className="py-2 pr-4">
        {user.email}
        {isCurrentAdmin && <span className="text-muted"> (you)</span>}
      </td>
      <td className="py-2 pr-4">{user.role}</td>
      <td className="py-2 pr-4">{user.createdAt.toISOString().slice(0, 10)}</td>
      <td className="py-2">
        <form action={changeRole}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="role" value={nextRole} />
          <button type="submit" className="underline">
            Make {nextRole}
          </button>
        </form>
      </td>
    </tr>
  );
}

function otherRole(role: Role): Role {
  return role === "admin" ? "student" : "admin";
}

function messageFor(value: string | string[] | undefined): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && isAdminUsersMessageKey(key)
    ? ADMIN_USERS_MESSAGES[key]
    : undefined;
}
