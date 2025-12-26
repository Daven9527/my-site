import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST() {
  // lastTicket += 1
  const ticketNumber = await redis.incr("queue:last");
  return NextResponse.json({ ticketNumber });
}
