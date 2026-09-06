import { handlers } from "@/auth";

// Auth.js owns everything under /api/auth: the magic-link callback, the
// credentials sign-in, sign-out, and the session endpoint.
export const { GET, POST } = handlers;
