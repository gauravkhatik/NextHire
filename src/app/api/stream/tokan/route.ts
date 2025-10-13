import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

import { currentUser } from "@clerk/nextjs/server";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const secret = process.env.STREAM_SECRET_KEY!; // Add this in your .env.local
const serverClient = new StreamClient(apiKey, secret);

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a Stream token for this user
  const token = serverClient.createToken(user.id);

  return NextResponse.json({ token });
}
