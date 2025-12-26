import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST() {
  await redis.mset({
    "queue:current": 0,
    "queue:last": 0,
  });

  return NextResponse.json({ ok: true });
}
