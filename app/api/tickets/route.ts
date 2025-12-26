import { NextResponse } from "next/server";
import { getAllTickets } from "@/lib/queue-store";

export async function GET() {
  const tickets = getAllTickets();
  return NextResponse.json(tickets);
}

