import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

// What this app puts on the session beyond Auth.js's defaults. The role on the
// session is a snapshot from sign-in time; src/lib/session.ts re-reads it from
// the database before anything that matters. The token itself is not augmented:
// src/auth.config.ts checks the role it carries at runtime instead.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}
