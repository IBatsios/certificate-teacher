import { buildReport, exportFileName, toCsv } from "@/lib/admin-report";
import { requireRole } from "@/lib/session";

/**
 * The report as a file the admin can open in a spreadsheet.
 *
 * A route handler rather than a server action, unlike every other form in the
 * app (D32, D56): a download needs `Content-Disposition`, which an action
 * cannot set. Nothing here is a form post.
 *
 * `requireRole` guards this door itself. The proxy already refuses anyone who
 * is not an admin, but a route that hands out every student's email should not
 * depend on something outside itself staying correct.
 */
export async function GET(): Promise<Response> {
  await requireRole("admin");

  const csv = toCsv(await buildReport());

  return new Response(csv, {
    headers: {
      // The charset matters: without it a spreadsheet may read an accented
      // name as mojibake.
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFileName()}"`,
      // It holds every student's email, so it is never to be cached anywhere.
      "cache-control": "no-store",
    },
  });
}
