import { createHmac, timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";

const COOKIE_NAME = "chessora_guest";
const secret = () => process.env.BETTER_AUTH_SECRET || "";

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export async function getViewer(headers: Headers): Promise<{ id: string; isGuest: boolean } | null> {
  const session = await auth.api.getSession({ headers });
  if (session) return { id: session.user.id, isGuest: false };
  const raw = headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
  if (!raw || !secret()) return null;
  const [id, signature] = decodeURIComponent(raw).split(".");
  if (!id || !signature) return null;
  const expected = sign(id);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return { id, isGuest: true };
}

export function guestCookie(id: string) {
  const value = encodeURIComponent(id + "." + sign(id));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}
