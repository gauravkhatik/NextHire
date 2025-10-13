import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { StreamClient } from "@stream-io/node-sdk";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { callId, callType, session, filename } = await request.json();
    if (!callId || !callType || !session || !filename) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    const secret = process.env.STREAM_SECRET_KEY!;
    const stream = new StreamClient(apiKey, secret);

    const call = stream.video.call(callType, callId);
    await call.deleteRecording({ session, filename });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}


