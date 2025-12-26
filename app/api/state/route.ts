import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentNumber = (await redis.get<number>("queue:current")) ?? 0;
  const lastTicket = (await redis.get<number>("queue:last")) ?? 0;

  return NextResponse.json({ currentNumber, lastTicket });
}
