import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await redis.mset({
      "queue:current": 0,
      "queue:last": 0,
    });
    // Clear the tickets list
    await redis.del("queue:tickets");

  return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "重置失敗" },
      { status: 500 }
    );
  }
}
