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
    select: {
      id: true, pgn: true, timeControl: true, result: true, status: true,
      whitePlayerId: true, blackPlayerId: true, startedAt: true,
      whitePlayer: { select: { playerProfile: { select: { username: true } } } },
      blackPlayer: { select: { playerProfile: { select: { username: true } } } },
    },
  });
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.whitePlayerId !== viewer.id && game.blackPlayerId !== viewer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = (game.startedAt ?? new Date()).toISOString().slice(0, 10).replaceAll("-", ".");
  const headersOut = new Headers({
    "Content-Type": "application/x-chess-pgn; charset=utf-8",
    "Content-Disposition": `attachment; filename="chessora-${game.id}.pgn"`,
    "Cache-Control": "private, no-store",
  });
  const tags = [
    `[Event "Chessora Online Game"]`,
    `[Site "Chessora"]`,
    `[Date "${date}"]`,
    `[White "${game.whitePlayer.playerProfile?.username ?? "White"}"]`,
    `[Black "${game.blackPlayer?.playerProfile?.username ?? "Black"}"]`,
    `[TimeControl "${game.timeControl.replace("+", "+")}"]`,
    `[Result "${game.result ?? "*"}"]`,
  ].join("\n");
  const movetext = game.pgn.trim();
  return new NextResponse(`${tags}\n\n${movetext ? movetext + " " : ""}${game.result ?? "*"}\n`, { headers: headersOut });
}
