import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getViewer, guestCookie } from "@/lib/guest";

export async function POST(request: Request) {
  const existing = await getViewer(request.headers);
  if (existing) return NextResponse.json({ viewerId: existing.id, isGuest: existing.isGuest });

  const id = randomUUID();
  const suffix = id.replaceAll("-", "").slice(0, 6).toUpperCase();
  const user = await prisma.user.create({
    data: {
      id,
      name: `Guest ${suffix}`,
      email: `guest+${id}@guest.chessora.invalid`,
      emailVerified: false,
      playerProfile: { create: { username: `Guest${suffix}` } },
    },
    select: { id: true },
  });
  const response = NextResponse.json({ viewerId: user.id, isGuest: true }, { status: 201 });
  response.headers.append("Set-Cookie", guestCookie(user.id));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
