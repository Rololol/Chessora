"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await authClient.signIn.email({ email, password, callbackURL: "/play" });
    setBusy(false);
    if (result.error) setError(result.error.message || "Sign in failed. Check your details and try again.");
    else router.push("/play");
  }

  return (
    <main className="auth-shell">
      <Link className="auth-back" href="/"><ArrowLeft size={15} /> Back to Chessora</Link>
      <section className="auth-card">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">C</span> chessora</Link>
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Good to see<br /><em>you again.</em></h1>
        <p className="auth-intro">Sign in to continue your chess journey.</p>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">New to Chessora? <Link href="/register">Create an account</Link></p>
        <p className="auth-legal">By continuing, you agree to use Chessora responsibly and follow fair-play rules.</p>
      </section>
    </main>
  );
}
