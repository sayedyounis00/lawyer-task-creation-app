import { NextResponse } from "next/server";
import { purgeExpiredCompletedTasks } from "@/lib/data";

export async function GET() {
  try {
    await purgeExpiredCompletedTasks();
    return NextResponse.json({ ok: true, message: "Purged completed tasks older than 24h" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cleanup failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
