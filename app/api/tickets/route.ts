import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

type TicketStatus = "pending" | "processing" | "completed" | "cancelled";

interface TicketInfo {
  ticketNumber: number;
  applicant?: string;
  customerName?: string;
  customerRequirement?: string;
  machineType?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  fcst?: string;
  massProductionDate?: string;
  status: TicketStatus;
  note: string;
  assignee?: string;
}

export async function GET() {
  try {
    const raw = await redis.lrange<number>("queue:tickets", 0, -1);

    // Convert to number array
    const ticketNumbers: number[] = (raw ?? [])
      .map((x: any) => Number(x))
      .filter((n) => Number.isFinite(n));

    if (ticketNumbers.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    // Fetch details for each ticket
    const tickets: TicketInfo[] = await Promise.all(
      ticketNumbers.map(async (ticketNumber) => {
        const key = `queue:ticket:${ticketNumber}`;
        const data = await redis.hgetall<{
          applicant?: string;
          customerName?: string;
          customerRequirement?: string;
          machineType?: string;
          startDate?: string;
          expectedCompletionDate?: string;
          fcst?: string;
          massProductionDate?: string;
          status?: string;
          note?: string;
          assignee?: string;
        }>(key);

        // Validate status value
        const validStatuses: TicketStatus[] = ["pending", "processing", "completed", "cancelled"];
        const statusValue = data?.status || "pending";
        const status: TicketStatus = validStatuses.includes(statusValue as TicketStatus)
          ? (statusValue as TicketStatus)
          : "pending";

        return {
          ticketNumber,
          applicant: data?.applicant || "",
          customerName: data?.customerName || "",
          customerRequirement: data?.customerRequirement || "",
          machineType: data?.machineType || "",
          startDate: data?.startDate || "",
          expectedCompletionDate: data?.expectedCompletionDate || "",
          fcst: data?.fcst || "",
          massProductionDate: data?.massProductionDate || "",
          status,
          note: data?.note || "",
          assignee: data?.assignee || "",
        };
      })
    );

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "處理請求時發生錯誤", tickets: [] },
      { status: 500 }
    );
  }
}
