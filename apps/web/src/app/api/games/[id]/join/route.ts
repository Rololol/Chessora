import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.status !== "WAITING" || game.blackPlayerId || game.whitePlayerId === session.user.id) {
    return NextResponse.json({ error: "This game is no longer available." }, { status: 409 });
  }
  const now = new Date();
  const claimed = await prisma.game.updateMany({
    where: { id, status: "WAITING", blackPlayerId: null },
    data: { blackPlayerId: session.user.id, status: "ACTIVE", startedAt: now, lastMoveAt: now },
  });
  if (claimed.count !== 1) return NextResponse.json({ error: "Another player joined first." }, { status: 409 });
  return NextResponse.json({ game: await prisma.game.findUnique({ where: { id } }) });
}
