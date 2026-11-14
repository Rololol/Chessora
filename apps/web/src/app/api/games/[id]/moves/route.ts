import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Chess } from "chess.js";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid move." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.from !== "string" || typeof input.to !== "string" ||
      !/^[a-h][1-8]$/.test(input.from) || !/^[a-h][1-8]$/.test(input.to)) {
    return NextResponse.json({ error: "Move squares must be valid chess coordinates." }, { status: 400 });
  }
  const promotion = typeof input.promotion === "string" ? input.promotion.toLowerCase() : "q";
  if (!["q", "r", "b", "n"].includes(promotion)) return NextResponse.json({ error: "Invalid promotion piece." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({ where: { id } });
      if (!game) return { error: "Game not found.", status: 404 };
      const userIsWhite = game.whitePlayerId === session.user.id;
      const userIsBlack = game.blackPlayerId === session.user.id;
      if (!userIsWhite && !userIsBlack) return { error: "Forbidden", status: 403 };
      if (game.status !== "ACTIVE" || !game.blackPlayerId || !game.lastMoveAt) return { error: "Game is not active.", status: 409 };

      const chess = new Chess(game.currentFen);
      const movingWhite = chess.turn() === "w";
      if ((movingWhite && !userIsWhite) || (!movingWhite && !userIsBlack)) return { error: "It is not your turn.", status: 409 };

      const now = new Date();
      const elapsed = Math.max(0, now.getTime() - game.lastMoveAt.getTime());
      const whiteTime = Math.max(0, (game.whiteTimeMs ?? 0) - (movingWhite ? elapsed : 0));
      const blackTime = Math.max(0, (game.blackTimeMs ?? 0) - (!movingWhite ? elapsed : 0));
      if ((movingWhite ? whiteTime : blackTime) <= 0) {
        const timeoutResult = chess.isInsufficientMaterial() ? "1/2-1/2" : movingWhite ? "0-1" : "1-0";
        const expired = await tx.game.updateMany({
          where: { id, status: "ACTIVE", updatedAt: game.updatedAt },
          data: { status: "COMPLETED", result: timeoutResult, endedAt: now, whiteTimeMs: whiteTime, blackTimeMs: blackTime, drawOfferBy: null },
        });
        if (expired.count !== 1) throw new Error("GAME_CONFLICT");
        return { error: "Time expired.", status: 409 };
      }

      let move;
      try { move = chess.move({ from: input.from, to: input.to, promotion }); }
      catch { return { error: "Illegal move.", status: 400 }; }
      const nextWhiteTime = whiteTime + (movingWhite ? game.incrementMs : 0);
      const nextBlackTime = blackTime + (!movingWhite ? game.incrementMs : 0);
      const terminal = chess.isGameOver();
      const outcome = chess.isCheckmate() ? (movingWhite ? "1-0" : "0-1") : terminal ? "1/2-1/2" : null;
      const updated = await tx.game.updateMany({
        where: { id, status: "ACTIVE", updatedAt: game.updatedAt },
        data: {
          currentFen: chess.fen(), pgn: chess.pgn(), whiteTimeMs: nextWhiteTime,
          blackTimeMs: nextBlackTime, lastMoveAt: now, drawOfferBy: null,
          ...(terminal ? { status: "COMPLETED" as const, result: outcome, endedAt: now } : {}),
        },
      });
      if (updated.count !== 1) throw new Error("GAME_CONFLICT");
      await tx.gameMove.create({
        data: { gameId: id, ply: chess.history().length, from: move.from, to: move.to,
          promotion: move.promotion, san: move.san, fenAfter: chess.fen() },
      });
      return { game: { fen: chess.fen(), pgn: chess.pgn(), san: move.san, status: terminal ? "COMPLETED" : "ACTIVE", result: outcome, whiteTimeMs: nextWhiteTime, blackTimeMs: nextBlackTime } };
    }, { isolationLevel: "Serializable" });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "GAME_CONFLICT") return NextResponse.json({ error: "Game changed; refresh and try again." }, { status: 409 });
    throw error;
  }
}
