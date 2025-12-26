import { NextResponse } from "next/server";
import { reset } from "@/lib/queue-store";

export async function POST() {
  reset();
  return NextResponse.json({ success: true });
}

