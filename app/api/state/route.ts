import { NextResponse } from "next/server";
import { getState } from "@/lib/queue-store";

export async function GET() {
  const state = getState();
  return NextResponse.json(state);
}

