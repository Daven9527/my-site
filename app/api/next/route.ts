import { NextResponse } from "next/server";
import { nextNumber } from "@/lib/queue-store";

export async function POST() {
  const currentNumber = nextNumber();
  return NextResponse.json({ currentNumber });
}

