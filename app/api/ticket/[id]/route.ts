import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

type TicketStatus = "pending" | "processing" | "completed" | "cancelled";

interface TicketInfo {
  ticketNumber: number;
  customerName?: string;
  customerRequirement?: string;
  machineType?: string;
  startDate?: string;
  status: TicketStatus;
  note: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketNumber = parseInt(id);
    if (isNaN(ticketNumber)) {
      return NextResponse.json({ error: "無效的票號" }, { status: 400 });
    }

    const key = `queue:ticket:${ticketNumber}`;
    const data = await redis.hgetall<{
      customerName?: string;
      customerRequirement?: string;
      machineType?: string;
      startDate?: string;
      status?: string;
      note?: string;
    }>(key);

    if (!data || Object.keys(data).length === 0) {
      // Return default values if ticket info doesn't exist
      return NextResponse.json({
        ticketNumber,
        status: "pending" as TicketStatus,
        note: "",
      });
    }

    return NextResponse.json({
      ticketNumber,
      customerName: data.customerName || "",
      customerRequirement: data.customerRequirement || "",
      machineType: data.machineType || "",
      startDate: data.startDate || "",
      status: (data?.status || "pending") as TicketStatus,
      note: data?.note || "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketNumber = parseInt(id);
    if (isNaN(ticketNumber)) {
      return NextResponse.json({ error: "無效的票號" }, { status: 400 });
    }

    const body = await request.json();
    const { status, note } = body;

    const key = `queue:ticket:${ticketNumber}`;
    const updates: { status?: string; note?: string } = {};

    if (status !== undefined) {
      if (!["pending", "processing", "completed", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "無效的狀態" }, { status: 400 });
      }
      updates.status = status;
    }

    if (note !== undefined) {
      updates.note = note;
    }

    if (Object.keys(updates).length > 0) {
      await redis.hset(key, updates);
    }

    // Return updated ticket info
    const data = await redis.hgetall<{ status?: string; note?: string }>(key);
    return NextResponse.json({
      ticketNumber,
      status: (data?.status || "pending") as TicketStatus,
      note: data?.note || "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤" },
      { status: 500 }
    );
  }
}

