// Messages the users page can show, keyed by the value in `?message=`. Unlike
// the other pages, some of these report success, so the parameter is not
// called `error`.
export const ADMIN_USERS_MESSAGES = {
  changed:
    "Role changed. It applies once that person signs out and signs in again; the app tells them so.",
  unchanged: "That person already has that role.",
  "own-role": "You cannot change your own role. Another admin has to do that.",
  "last-admin":
    "That is the only admin. Make someone else an admin first, then change this one.",
  "not-found": "We could not find that person. They may have been removed.",
  invalid: "That change was not understood. Use the buttons on this page.",
  "not-saved": "The change could not be saved. Wait a moment and try again.",
} as const;

export type AdminUsersMessageKey = keyof typeof ADMIN_USERS_MESSAGES;

export function isAdminUsersMessageKey(
  value: string,
): value is AdminUsersMessageKey {
  return Object.hasOwn(ADMIN_USERS_MESSAGES, value);
}

/** The users page URL that shows the given message. */
export function adminUsersPageWithMessage(key: AdminUsersMessageKey): string {
  return `/admin/users?message=${key}`;
}
