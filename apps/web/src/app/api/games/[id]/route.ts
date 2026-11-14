import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getViewer } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer(await headers());
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      moves: { orderBy: { ply: "asc" } },
      whitePlayer: { select: { id: true, playerProfile: { select: { username: true } } } },
      blackPlayer: { select: { id: true, playerProfile: { select: { username: true } } } },
    },
  });
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.whitePlayerId !== viewer.id && game.blackPlayerId !== viewer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ game: { ...game, viewerId: viewer.id } });
}
