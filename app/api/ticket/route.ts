import { NextResponse } from "next/server";
import { issueTicket } from "@/lib/queue-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerRequirement, machineType, startDate } = body;

    // Validate required fields
    if (!customerName || !customerRequirement || !machineType || !startDate) {
      return NextResponse.json(
        { error: "所有欄位都是必填的" },
        { status: 400 }
      );
    }

    const ticketNumber = issueTicket({
      customerName,
      customerRequirement,
      machineType,
      startDate,
    });

    return NextResponse.json({ ticketNumber });
  } catch (error) {
    return NextResponse.json(
      { error: "處理請求時發生錯誤" },
      { status: 500 }
    );
  }
}

