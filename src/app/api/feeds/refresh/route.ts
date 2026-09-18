import { refreshFeeds } from "@/features/feeds/actions";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const expected = process.env.FEED_REFRESH_SECRET;

  if (expected) {
    const provided = request.headers.get("x-refresh-secret");
    if (provided !== expected) {
      return Response.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
  } else if (!(await isAdmin())) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshFeeds();
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
