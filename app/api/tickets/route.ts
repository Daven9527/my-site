import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type TicketStatus = "pending" | "called" | "done";
type TicketInfo = {
  ticketNumber: number;
  status: TicketStatus;
  note: string;
};

export async function GET() {
  // ✅ 正確：取得 ticket number list
  const raw = await redis.lrange<number>("queue:tickets", 0, -1);

  // ✅ 保底：確保轉成 number[]
  const ticketNumbers: number[] = (raw ?? [])
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n));

  // ✅ 每張票取得其詳細資訊
  const tickets: TicketInfo[] = await Promise.all(
    ticketNumbers.map(async (ticketNumber) => {
      const key = `queue:ticket:${ticketNumber}`;
      const data = await redis.hgetall<{ status?: string; note?: string }>(key);

      const status: TicketStatus =
        data?.status === "called" || data?.status === "done"
          ? (data.status as TicketStatus)
          : "pending";

      return {
        ticketNumber,
        status,
        note: data?.note ?? "",
      };
    })
  );

  return NextResponse.json({ tickets });
}
