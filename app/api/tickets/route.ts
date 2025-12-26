import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await redis.lrange<number[]>("queue:tickets", 0, -1);
    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤", tickets: [] },
      { status: 500 }
    );
  }
}

