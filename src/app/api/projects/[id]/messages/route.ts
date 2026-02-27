import { NextRequest, NextResponse } from "next/server";
import {
  getBrainstormMessages,
  saveBrainstormMessages,
  getOutlineMessages,
  saveOutlineMessages,
} from "@/lib/storage/messages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phase = req.nextUrl.searchParams.get("phase");

  if (phase === "outline") {
    const messages = await getOutlineMessages(id);
    return NextResponse.json({ messages });
  }

  const messages = await getBrainstormMessages(id);
  return NextResponse.json({ messages });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { phase, messages } = await req.json();

  if (phase === "outline") {
    await saveOutlineMessages(id, messages);
  } else {
    await saveBrainstormMessages(id, messages);
  }

  return NextResponse.json({ success: true });
}
