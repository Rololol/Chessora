import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getViewer } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

const controls: Record<string, { initialMs: number; incrementMs: number }> = {
  "1+0": { initialMs: 60_000, incrementMs: 0 },
  "3+0": { initialMs: 180_000, incrementMs: 0 },
  "3+2": { initialMs: 180_000, incrementMs: 2_000 },
  "5+0": { initialMs: 300_000, incrementMs: 0 },
  "5+3": { initialMs: 300_000, incrementMs: 3_000 },
  "10+0": { initialMs: 600_000, incrementMs: 0 },
  "15+10": { initialMs: 900_000, incrementMs: 10_000 },
};

export async function GET(request: Request) {
  const viewer = await getViewer(await headers());
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = new URL(request.url).searchParams.get("scope");
  const where = scope === "history"
    ? { OR: [{ whitePlayerId: viewer.id }, { blackPlayerId: viewer.id }] }
    : { OR: [{ whitePlayerId: viewer.id }, { blackPlayerId: viewer.id }, { status: "WAITING" as const, blackPlayerId: null }] };
  const games = await prisma.game.findMany({
    where,
    orderBy: { updatedAt: "desc" }, take: 30,
    select: {
      id: true, status: true, timeControl: true, result: true, pgn: true, currentFen: true,
      whiteTimeMs: true, blackTimeMs: true, createdAt: true, startedAt: true, endedAt: true,
      whitePlayer: { select: { id: true, playerProfile: { select: { username: true } } } },
      blackPlayer: { select: { id: true, playerProfile: { select: { username: true } } } },
    },
  });
  return NextResponse.json({ games, viewerId: viewer.id, viewerIsGuest: viewer.isGuest });
}

export async function POST(request: Request) {
  const viewer = await getViewer(await headers());
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const timeControl = body && typeof body === "object" && "timeControl" in body && typeof body.timeControl === "string" ? body.timeControl : "5+0";
  const control = controls[timeControl];
  if (!control) return NextResponse.json({ error: "Unsupported time control." }, { status: 400 });

  const game = await prisma.game.create({
    data: {
      whitePlayerId: viewer.id, timeControl,
      whiteTimeMs: control.initialMs, blackTimeMs: control.initialMs,
      incrementMs: control.incrementMs,
    },
    select: { id: true, status: true, timeControl: true, createdAt: true },
  });
  return NextResponse.json({ game }, { status: 201 });
}
