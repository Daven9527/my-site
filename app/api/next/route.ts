import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST() {
  const currentNumber = (await redis.get<number>("queue:current")) ?? 0;
  const lastTicket = (await redis.get<number>("queue:last")) ?? 0;

  if (currentNumber >= lastTicket) {
    return NextResponse.json({ currentNumber, message: "No more tickets" });
  }

  const newCurrent = await redis.incr("queue:current");
  return NextResponse.json({ currentNumber: newCurrent });
}
