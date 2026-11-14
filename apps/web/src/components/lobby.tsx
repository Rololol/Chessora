"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, Swords, Settings } from "lucide-react";

type Game = {
  id: string; status: "WAITING" | "ACTIVE" | "COMPLETED" | "ABORTED";
  timeControl: string; result: string | null; createdAt: string;
  whitePlayer: { id: string; playerProfile: { username: string } | null };
  blackPlayer: { id: string; playerProfile: { username: string } | null } | null;
};

const controls = ["1+0", "3+0", "3+2", "5+0", "5+3", "10+0", "15+10"];

export default function Lobby() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [viewerId, setViewerId] = useState("");
  const [isGuest, setIsGuest] = useState(true);
  const [control, setControl] = useState("5+0");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/guest/session", { method: "POST" });
      const response = await fetch("/api/games", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load games.");
      setGames(data.games);
      setViewerId(data.viewerId);
      setIsGuest(Boolean(data.viewerIsGuest));
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load games."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); const timer = window.setInterval(refresh, 5000); return () => window.clearInterval(timer); }, [refresh]);

  async function createGame() {
    setBusy(true); setError("");
    try {
      await fetch("/api/guest/session", { method: "POST" });
      const response = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timeControl: control }) });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Could not create game.");
      router.push(`/games/${data.game.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create game."); }
    finally { setBusy(false); }
  }

  async function joinGame(id: string) {
    setBusy(true); setError("");
    try {
      await fetch("/api/guest/session", { method: "POST" });
      const response = await fetch(`/api/games/${id}/join`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join game.");
      router.push(`/games/${id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not join game."); await refresh(); }
    finally { setBusy(false); }
  }

  return <main className="lobby-shell">
    <header className="lobby-nav"><Link className="brand" href="/"><span className="brand-mark">C</span> chessora</Link><div>{!isGuest && <><Link href="/history">History</Link><Link href="/profile">Profile</Link></>}<Link href="/play">Practice board</Link>{isGuest && <Link href="/register">Create account</Link>}<Link href="/settings" aria-label="Settings"><Settings size={15}/></Link></div></header>
    <section className="lobby-content">
      <Link className="profile-back" href="/"><ArrowLeft size={15}/> Back home</Link>
      <div className="lobby-heading"><span className="eyebrow">ONLINE ARENA · EARLY ACCESS</span><h1>Find your next<br/><em>opponent.</em></h1><p>Create a challenge or join an open game. Games are currently turn-synchronized by polling.</p></div>
      <div className="lobby-create"><div><span className="eyebrow">CREATE A CHALLENGE</span><h2>Set the pace.</h2></div><div className="lobby-create-actions"><label htmlFor="time-control">Time control</label><select id="time-control" value={control} onChange={event=>setControl(event.target.value)}>{controls.map(value=><option key={value} value={value}>{value}</option>)}</select><button type="button" onClick={createGame} disabled={busy}><Plus size={16}/> {busy ? "Working…" : "Create game"}</button></div></div>
      <div className="lobby-list-head"><div><span className="eyebrow">MATCHMAKING</span><h2>Open games</h2></div><button className="lobby-refresh" onClick={()=>void refresh()}><RefreshCw size={14}/> Refresh</button></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {loading ? <p className="lobby-empty">Loading games…</p> : games.filter(game=>game.status==="WAITING" || game.status==="ACTIVE").length===0 ? <div className="lobby-empty"><Swords size={24}/><p>No games yet. Create the first challenge.</p></div> :
        <div className="lobby-games">{games.filter(game=>game.status==="WAITING" || game.status==="ACTIVE").map(game=><article className="lobby-game" key={game.id}><div className="lobby-game-icon"><Swords size={18}/></div><div className="lobby-game-info"><strong>{game.whitePlayer.playerProfile?.username || "White"} <span>vs</span> {game.blackPlayer?.playerProfile?.username || (game.status==="WAITING" ? "Open seat" : "Black")}</strong><small>{game.timeControl} · {game.status==="WAITING" ? "Waiting for opponent" : "In progress"}</small></div>{game.status==="WAITING" && game.whitePlayer.id!==viewerId ? <button onClick={()=>joinGame(game.id)} disabled={busy}>Join game</button> : <Link href={`/games/${game.id}`}>{game.status==="WAITING"?"Waiting room":"Open game"}</Link>}</article>)}</div>}
      <p className="lobby-footnote">{isGuest ? "You are playing as a guest. Guest games are unranked; create an account to save your profile and personal history." : "You are signed in. Please note: live updates currently refresh every five seconds in the lobby and every two seconds in a game."}</p>
    </section>
  </main>;
}
