import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Chess } from "chess.js";
import type { Prisma } from "@prisma/client";
import { getViewer } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

const allowed = ["resign", "offer_draw", "accept_draw", "decline_draw", "cancel"] as const;
type Action = typeof allowed[number];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer(await headers());
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const action = body && typeof body === "object" && "action" in body ? body.action : null;
  if (typeof action !== "string" || !allowed.includes(action as Action)) {
    return NextResponse.json({ error: "Unsupported game action." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({ where: { id } });
      if (!game) return { error: "Game not found.", status: 404 };
      const isWhite = game.whitePlayerId === viewer.id;
      const isBlack = game.blackPlayerId === viewer.id;
      if (!isWhite && !isBlack) return { error: "Forbidden", status: 403 };
      const now = new Date();

      if (action === "cancel") {
        if (!isWhite || game.status !== "WAITING") return { error: "Only the creator can cancel a waiting game.", status: 409 };
        const changed = await tx.game.updateMany({
          where: { id, status: "WAITING", updatedAt: game.updatedAt },
          data: { status: "ABORTED", endedAt: now },
        });
        if (changed.count !== 1) throw new Error("GAME_CONFLICT");
        return { game: { status: "ABORTED", result: null, drawOfferBy: null } };
      }

      if (game.status !== "ACTIVE" || !game.blackPlayerId || !game.lastMoveAt) {
        return { error: "Game is not active.", status: 409 };
      }

      const chess = new Chess(game.currentFen);
      const whiteToMove = chess.turn() === "w";
      const elapsed = Math.max(0, now.getTime() - game.lastMoveAt.getTime());
      const whiteTime = Math.max(0, (game.whiteTimeMs ?? 0) - (whiteToMove ? elapsed : 0));
      const blackTime = Math.max(0, (game.blackTimeMs ?? 0) - (!whiteToMove ? elapsed : 0));
      if ((whiteToMove ? whiteTime : blackTime) <= 0) {
        const flaggingWhite = whiteToMove;
        const outcome = chess.isInsufficientMaterial() ? "1/2-1/2" : flaggingWhite ? "0-1" : "1-0";
        const changed = await tx.game.updateMany({
          where: { id, status: "ACTIVE", updatedAt: game.updatedAt },
          data: { status: "COMPLETED", result: outcome, endedAt: now, whiteTimeMs: whiteTime, blackTimeMs: blackTime, drawOfferBy: null },
        });
        if (changed.count !== 1) throw new Error("GAME_CONFLICT");
        return { game: { status: "COMPLETED", result: outcome, drawOfferBy: null } };
      }

      let data: Prisma.GameUpdateManyMutationInput;
      if (action === "resign") {
        data = { status: "COMPLETED", result: isWhite ? "0-1" : "1-0", endedAt: now, whiteTimeMs: whiteTime, blackTimeMs: blackTime, drawOfferBy: null };
      } else if (action === "offer_draw") {
        if (game.drawOfferBy) return { error: "A draw offer is already pending.", status: 409 };
        data = { drawOfferBy: viewer.id, whiteTimeMs: whiteTime, blackTimeMs: blackTime, lastMoveAt: now };
      } else if (action === "accept_draw") {
        if (!game.drawOfferBy || game.drawOfferBy === viewer.id) return { error: "There is no draw offer from your opponent.", status: 409 };
        data = { status: "COMPLETED", result: "1/2-1/2", endedAt: now, whiteTimeMs: whiteTime, blackTimeMs: blackTime, drawOfferBy: null };
      } else {
        if (!game.drawOfferBy || game.drawOfferBy === viewer.id) return { error: "There is no opponent draw offer to decline.", status: 409 };
        data = { drawOfferBy: null, whiteTimeMs: whiteTime, blackTimeMs: blackTime, lastMoveAt: now };
      }

      const changed = await tx.game.updateMany({
        where: { id, status: "ACTIVE", updatedAt: game.updatedAt },
        data,
      });
      if (changed.count !== 1) throw new Error("GAME_CONFLICT");
      return { game: { status: data.status ?? "ACTIVE", result: data.result ?? null, drawOfferBy: data.drawOfferBy ?? null } };
    }, { isolationLevel: "Serializable" });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "GAME_CONFLICT") return NextResponse.json({ error: "Game changed; refresh and try again." }, { status: 409 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Concurrent game update; refresh and try again." }, { status: 409 });
    }
    throw error;
  }
}
