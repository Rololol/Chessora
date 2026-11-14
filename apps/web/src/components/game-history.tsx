"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, History as HistoryIcon } from "lucide-react";

type Item = {
  id: string; status: string; timeControl: string; result: string | null; pgn: string; createdAt: string;
  whitePlayer: { id: string; playerProfile: { username: string } | null };
  blackPlayer: { id: string; playerProfile: { username: string } | null } | null;
};

export default function GameHistory() {
  const router=useRouter();
  const [games,setGames]=useState<Item[]>([]);
  const [viewerId,setViewerId]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/games?scope=history",{cache:"no-store"}).then(async response=>{
      const data=await response.json();
      if(response.status===401){router.push("/login");return;}
      if(!response.ok)throw new Error(data.error||"Could not load history.");
      setGames(data.games);setViewerId(data.viewerId);
    }).catch(reason=>setError(reason instanceof Error?reason.message:"Could not load history.")).finally(()=>setLoading(false));
  },[router]);
  const outcome=(game:Item)=>game.result==="1/2-1/2"?"Draw":game.result==="1-0"?(game.whitePlayer.id===viewerId?"Win":"Loss"):game.result==="0-1"?(game.blackPlayer?.id===viewerId?"Win":"Loss"):game.status==="ABORTED"?"Cancelled":game.status==="WAITING"?"Waiting":"In progress";
  return <main className="lobby-shell"><header className="lobby-nav"><Link className="brand" href="/"><span className="brand-mark">C</span> chessora</Link><div><Link href="/multiplayer">Lobby</Link><Link href="/profile">Profile</Link></div></header><section className="lobby-content"><Link className="profile-back" href="/multiplayer"><ArrowLeft size={15}/> Back to lobby</Link><div className="lobby-heading"><span className="eyebrow">YOUR CHESS JOURNEY</span><h1>Game <em>history.</em></h1><p>Your recent games, results and downloadable PGN records.</p></div>{error&&<p className="auth-error" role="alert">{error}</p>}{loading?<p className="lobby-empty">Loading history…</p>:games.length===0?<div className="lobby-empty"><HistoryIcon size={24}/><p>No games recorded yet.</p></div>:<div className="history-list">{games.map(game=><article className="history-item" key={game.id}><div><strong>{game.whitePlayer.playerProfile?.username||"White"} <span>vs</span> {game.blackPlayer?.playerProfile?.username||"—"}</strong><small>{new Date(game.createdAt).toLocaleString()} · {game.timeControl}</small></div><span className={"history-result "+(outcome(game)==="Win"?"won":outcome(game)==="Loss"?"lost":"")}>{outcome(game)}</span><div className="history-actions"><Link href={"/games/"+game.id}>Open</Link>{game.pgn!==""&&<a href={"/api/games/"+game.id+"/pgn"}><Download size={14}/> PGN</a>}</div></article>)}</div>}</section></main>;
}
