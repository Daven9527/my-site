import { NextResponse } from "next/server";
import { updateTicket, getTicket } from "@/lib/queue-store";
import { TicketStatus } from "@/lib/queue-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketNumber = parseInt(id);
  if (isNaN(ticketNumber)) {
    return NextResponse.json({ error: "無效的票號" }, { status: 400 });
  }

  const ticket = getTicket(ticketNumber);
  if (!ticket) {
    return NextResponse.json({ error: "找不到票券" }, { status: 404 });
  }

  return NextResponse.json(ticket);
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
    const { status, reply } = body;

    const updates: { status?: TicketStatus; reply?: string } = {};

    if (status !== undefined) {
      if (!["pending", "processing", "completed", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "無效的狀態" }, { status: 400 });
      }
      updates.status = status as TicketStatus;
    }

    if (reply !== undefined) {
      updates.reply = reply;
    }

    const success = updateTicket(ticketNumber, updates);
    if (!success) {
      return NextResponse.json({ error: "找不到票券" }, { status: 404 });
    }

    const updatedTicket = getTicket(ticketNumber);
    return NextResponse.json(updatedTicket);
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤" },
      { status: 500 }
    );
  }
}

