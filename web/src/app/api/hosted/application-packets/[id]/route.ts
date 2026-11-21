import { NextResponse } from "next/server";

import {
  getHostedApplicationPacket,
  saveHostedApplicationPacket,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedApplicationPacketSchema } from "@/lib/hosted/profile-schema";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const packet = await getHostedApplicationPacket(ownerId, id);
    return packet
      ? NextResponse.json(packet)
      : NextResponse.json({ error: "Application packet not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the application packet.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const current = await getHostedApplicationPacket(ownerId, id);
    if (!current) return NextResponse.json({ error: "Application packet not found." }, { status: 404 });
    const parsed = hostedApplicationPacketSchema.safeParse(await request.json());
    if (!parsed.success || parsed.data.jobId !== current.packet.jobId) {
      return NextResponse.json({ error: "The application packet is incomplete or invalid." }, { status: 400 });
    }
    return NextResponse.json({ packet: await saveHostedApplicationPacket(ownerId, parsed.data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the application packet.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : /require|verified|pin|selected/i.test(message) ? 400 : 500 });
  }
}
