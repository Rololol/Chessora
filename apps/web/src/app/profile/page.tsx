"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, UserRound } from "lucide-react";

type Profile = {
  username: string; bio: string | null; countryCode: string | null;
  bulletRating: number; blitzRating: number; rapidRating: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load profile.");
      setProfile(data.profile);
      setUsername(data.profile.username);
      setBio(data.profile.bio || "");
      setCountryCode(data.profile.countryCode || "");
    }).catch((reason: Error) => setError(reason.message));
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, countryCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save profile.");
      setProfile((current) => current ? { ...current, ...data.profile } : data.profile);
      setNotice("Profile saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save profile."); }
    finally { setBusy(false); }
  }

  if (!profile && !error) return <main className="profile-shell"><p>Loading player profile…</p></main>;

  return (
    <main className="profile-shell">
      <Link className="profile-back" href="/play"><ArrowLeft size={15} /> Back to the board</Link>
      <section className="profile-layout">
        <div className="profile-heading"><span className="profile-avatar"><UserRound size={27} /></span><span className="eyebrow">PLAYER IDENTITY</span><h1>Your profile.</h1><p>Set how other players see you on Chessora.</p></div>
        {profile && <div className="profile-ratings">
          <div><span>BULLET</span><strong>{profile.bulletRating}</strong></div>
          <div><span>BLITZ</span><strong>{profile.blitzRating}</strong></div>
          <div><span>RAPID</span><strong>{profile.rapidRating}</strong></div>
          <small>Starting ratings · updated after rated games are implemented</small>
        </div>}
        <form className="profile-form" onSubmit={save}>
          <label htmlFor="username">Username</label>
          <input id="username" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} />
          <label htmlFor="country">Country code</label>
          <input id="country" maxLength={2} value={countryCode} onChange={(event) => setCountryCode(event.target.value.toUpperCase())} placeholder="e.g. DE" />
          <label htmlFor="bio">About you</label>
          <textarea id="bio" rows={4} maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Your chess story, goals or favorite opening…" />
          <div className="profile-form-foot"><span>{bio.length}/280</span><button className="auth-submit" type="submit" disabled={busy}><Save size={15} /> {busy ? "Saving…" : "Save profile"}</button></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="profile-notice" role="status">{notice}</p>}
        </form>
      </section>
    </main>
  );
}
