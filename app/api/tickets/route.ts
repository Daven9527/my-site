import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

type TicketStatus = "pending" | "processing" | "completed" | "cancelled";

interface TicketInfo {
  ticketNumber: number;
  status: TicketStatus;
  note: string;
}

export async function GET() {
  try {
    const ticketNumbers = await redis.lrange<number[]>("queue:tickets", 0, -1);
    
    if (!ticketNumbers || ticketNumbers.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    // Fetch details for each ticket
    const tickets: TicketInfo[] = await Promise.all(
      ticketNumbers.map(async (ticketNumber) => {
        const key = `queue:ticket:${ticketNumber}`;
        const data = await redis.hgetall<{ status?: string; note?: string }>(key);
        
        return {
          ticketNumber,
          status: (data?.status || "pending") as TicketStatus,
          note: data?.note || "",
        };
      })
    );

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤", tickets: [] },
      { status: 500 }
    );
  }
}

