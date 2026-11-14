import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getViewer } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer(await headers());
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.status !== "WAITING" || game.blackPlayerId || game.whitePlayerId === viewer.id) {
    return NextResponse.json({ error: "This game is no longer available." }, { status: 409 });
  }
  const now = new Date();
  const claimed = await prisma.game.updateMany({
    where: { id, status: "WAITING", blackPlayerId: null },
    data: { blackPlayerId: viewer.id, status: "ACTIVE", startedAt: now, lastMoveAt: now },
  });
  if (claimed.count !== 1) return NextResponse.json({ error: "Another player joined first." }, { status: 409 });
  return NextResponse.json({ game: await prisma.game.findUnique({ where: { id } }) });
}
