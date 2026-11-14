import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.playerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      username: `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "player"}${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toLowerCase()}`,
    },
    update: {},
    select: {
      username: true, bio: true, countryCode: true, avatarUrl: true,
      bulletRating: true, blitzRating: true, rapidRating: true, createdAt: true,
    },
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid profile" }, { status: 400 });

  const input = body as Record<string, unknown>;
  const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  const countryCode = typeof input.countryCode === "string" ? input.countryCode.trim().toUpperCase() : "";

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3–20 characters: letters, numbers or underscores." }, { status: 400 });
  }
  if (bio.length > 280) return NextResponse.json({ error: "Bio must be 280 characters or fewer." }, { status: 400 });
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: "Country code must be a two-letter ISO code." }, { status: 400 });
  }

  try {
    const profile = await prisma.playerProfile.update({
      where: { userId: user.id },
      data: { username, bio: bio || null, countryCode: countryCode || null },
      select: { username: true, bio: true, countryCode: true, bulletRating: true, blitzRating: true, rapidRating: true },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    throw error;
  }
}
