"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await authClient.signUp.email({ name: name.trim(), email, password, callbackURL: "/play" });
    setBusy(false);
    if (result.error) setError(result.error.message || "Account creation failed. Try another email address.");
    else router.push("/play");
  }

  return (
    <main className="auth-shell">
      <Link className="auth-back" href="/"><ArrowLeft size={15} /> Back to Chessora</Link>
      <section className="auth-card">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">C</span> chessora</Link>
        <span className="eyebrow">YOUR NEXT MOVE STARTS HERE</span>
        <h1>Make room<br /><em>for growth.</em></h1>
        <p className="auth-intro">Create your Chessora account and start building your game.</p>
        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="name">Display name</label>
          <input id="name" type="text" autoComplete="nickname" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} placeholder="How players will know you" />
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">Already playing? <Link href="/login">Sign in</Link></p>
        <p className="auth-legal">Use a unique password. Never share your login details with other players.</p>
      </section>
    </main>
  );
}
