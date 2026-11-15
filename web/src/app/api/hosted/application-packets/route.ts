import { NextResponse } from "next/server";

import {
  listHostedApplicationPackets,
  saveHostedApplicationPacket,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedApplicationPacketSchema } from "@/lib/hosted/profile-schema";

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    return NextResponse.json({ packets: await listHostedApplicationPackets(ownerId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load application packets.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = hostedApplicationPacketSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "The application packet is incomplete or invalid." }, { status: 400 });
    }
    const packet = await saveHostedApplicationPacket(ownerId, parsed.data);
    return NextResponse.json({ packet }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the application packet.";
    const status = message === "Authentication required." ? 401 : /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
