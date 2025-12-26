import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type TicketStatus = "pending" | "called" | "done";
type TicketInfo = { ticketNumber: number; status: TicketStatus; note: string };

export async function GET() {
  // ✅ 這裡一定要是 number（不是 number[]）
  const raw = await redis.lrange<number>("queue:tickets", 0, -1);

  // ✅ 保底：把可能的 string/unknown 轉成 number
  const ticketNumbers: number[] = (raw ?? [])
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n));

  const tickets: TicketInfo[] = await Promise.all(
    ticketNumbers.map(async (ticketNumber) => {
      const key = `queue:ticket:${ticketNumber}`;
      const data = await redis.hgetall<{ status?: string; note?: string }>(key);

      const status: TicketStatus =
        data?.status === "called" || data?.status === "done" ? data.status : "pending";

      const note = data?.note ?? "";

      return { ticketNumber, status, note };
    })
  );

  return NextResponse.json({ tickets });
}
