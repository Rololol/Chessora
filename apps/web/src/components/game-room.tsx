"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Chess, type Square } from "chess.js";
import { ArrowLeft, RefreshCw, Settings } from "lucide-react";
import { readSettings, playChessSound, type ChessoraSettings } from "@/lib/settings";

type RoomGame = {
  id: string; status: "WAITING" | "ACTIVE" | "COMPLETED" | "ABORTED";
  currentFen: string; pgn: string; result: string | null; drawOfferBy: string | null; timeControl: string;
  whiteTimeMs: number | null; blackTimeMs: number | null; incrementMs: number;
  lastMoveAt: string | null; whitePlayerId: string; blackPlayerId: string | null;
  whitePlayer: { id: string; playerProfile: { username: string } | null };
  blackPlayer: { id: string; playerProfile: { username: string } | null } | null;
  moves: { ply: number; san: string }[];
  viewerIsGuest?: boolean;
};
const pieces: Record<string,string> = { wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟" };
const clock = (ms:number) => `${Math.floor(ms/60000)}:${String(Math.floor(ms%60000/1000)).padStart(2,"0")}`;

export default function GameRoom({ id }: { id: string }) {
  const [game,setGame]=useState<RoomGame|null>(null);
  const [userId,setUserId]=useState("");
  const [selected,setSelected]=useState<Square|null>(null);
  const [promotion,setPromotion]=useState<{from:Square;to:Square}|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [now,setNow]=useState(Date.now());
  const [prefs,setPrefs]=useState<ChessoraSettings|null>(null);
  useEffect(()=>{const load=()=>setPrefs(readSettings());load();window.addEventListener("chessora-settings",load);return()=>window.removeEventListener("chessora-settings",load)},[]);

  const refresh=useCallback(async()=>{
    try {
      await fetch("/api/guest/session",{method:"POST"});
      const response=await fetch(`/api/games/${id}`,{cache:"no-store"});
      const data=await response.json();

      if(!response.ok)throw new Error(data.error||"Could not load game.");
      setGame(data.game);
      setUserId((current)=>current || data.game.viewerId || "");
      setError("");
    } catch(reason){setError(reason instanceof Error?reason.message:"Could not load game.");}
  },[id]);

  useEffect(()=>{void refresh();const poll=window.setInterval(refresh,2000);const tick=window.setInterval(()=>setNow(Date.now()),250);return()=>{window.clearInterval(poll);window.clearInterval(tick)};},[refresh]);

  const chess=useMemo(()=>{const value=new Chess();if(game?.currentFen)value.load(game.currentFen);return value;},[game?.currentFen]);
  const history=chess.history({verbose:true});
  const viewerIsWhite=game?.whitePlayerId===userId;
  const viewerIsBlack=game?.blackPlayerId===userId;
  const myTurn=game?.status==="ACTIVE" && ((chess.turn()==="w"&&viewerIsWhite)||(chess.turn()==="b"&&viewerIsBlack));
  const remaining=(color:"w"|"b")=>{
    if(!game)return 0;
    const base=color==="w"?(game.whiteTimeMs??0):(game.blackTimeMs??0);
    const active=game.status==="ACTIVE" && game.lastMoveAt && chess.turn()===color;
    return Math.max(0,base-(active?now-new Date(game.lastMoveAt!).getTime():0));
  };
  const targets=selected?chess.moves({square:selected,verbose:true}).map(move=>move.to):[];

  async function sendMove(from:Square,to:Square,promote="q"){
    setBusy(true);setError("");
    try{
      const response=await fetch(`/api/games/${id}/moves`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({from,to,promotion:promote})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Move rejected.");
      playChessSound(chess.get(to) ? "capture" : "move");
      setSelected(null);setPromotion(null);await refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Move failed.");await refresh();}
    finally{setBusy(false);}
  }
  async function gameAction(action:"resign"|"offer_draw"|"accept_draw"|"decline_draw"|"cancel"){
    const prompt=action==="resign"?"Resign this game?":action==="cancel"?"Cancel this waiting game?":action==="accept_draw"?"Accept the draw offer?":action==="offer_draw"?"Offer a draw?":"Decline the draw offer?";
    if(!window.confirm(prompt))return;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/games/"+id+"/actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Action failed.");
      await refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Action failed.");await refresh();}
    finally{setBusy(false);}
  }
  function clickSquare(square:Square){
    if(!myTurn||busy||promotion)return;
    const piece=chess.get(square);
    if(selected){
      const move=chess.moves({square:selected,verbose:true}).find(candidate=>candidate.to===square);
      if(move){if(move.flags.includes("p")){setPromotion({from:selected,to:square});return;}void sendMove(selected,square);return;}
    }
    if(piece&&piece.color===chess.turn())setSelected(square);else setSelected(null);
  }

  if(!game)return <main className="room-shell"><p>{error||"Loading game…"}</p><Link href="/multiplayer">Back to lobby</Link></main>;
  const finished=game.status==="COMPLETED"||game.status==="ABORTED";
  const status=finished?(game.status==="ABORTED"?"Game cancelled":game.result==="1-0"?"White wins":game.result==="0-1"?"Black wins":"Draw"):game.status==="WAITING"?"Waiting for an opponent":myTurn?"Your move": "Opponent's turn";

  return <main className="room-shell">
    <header className="lobby-nav"><Link className="brand" href="/"><span className="brand-mark">C</span> chessora</Link><div><Link href="/multiplayer">Lobby</Link>{!game.viewerIsGuest&&<Link href="/history">History</Link>}<a href={"/api/games/"+id+"/pgn"}>PGN</a>{!game.viewerIsGuest&&<Link href="/profile">Profile</Link>}{game.viewerIsGuest&&<Link href="/register">Create account</Link>}<Link href="/settings" aria-label="Settings"><Settings size={15}/></Link></div></header>
    <section className="room-content"><Link className="profile-back" href="/multiplayer"><ArrowLeft size={15}/> Back to lobby</Link>
      <div className="room-heading"><div><span className="eyebrow">LIVE GAME · {game.timeControl}</span><h1>Play the position.</h1></div><span className="room-status">{status}</span></div>
      <div className="room-layout"><div className="room-board-column">
        <div className="room-player"><span>♚</span><div><b>{game.blackPlayer?.playerProfile?.username||"Black"}</b><small>{viewerIsBlack?"You":""}</small></div><strong className={chess.turn()==="b"&&game.status==="ACTIVE"?"clock-active":""}>{clock(remaining("b"))}</strong></div>
        <div className="room-board" role="grid" aria-label="Chess game board">{chess.board().flatMap((rank,row)=>rank.map((piece,col)=>{
          const square=`${"abcdefgh"[col]}${8-row}` as Square;
          const light=(row+col)%2===0;
          const isLast=history.at(-1)?.from===square||history.at(-1)?.to===square;
          return <button key={square} type="button" role="gridcell" aria-label={square} disabled={!myTurn||busy} onClick={()=>clickSquare(square)} className={`room-square ${prefs?.board==="blue"?"ocean":prefs?.board==="wood"?"wood":prefs?.board==="green"?"forest":light?"light":"dark"} ${selected===square?"selected":""} ${isLast?"last":""}`}>
            {piece&&<span className={piece.color==="w"?"piece-white":"piece-black"}>{prefs?.pieces==="minimal" ? ({k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"}[piece.type]) : pieces[piece.color+piece.type]}</span>}
            {targets.includes(square)&&<i className={piece?"room-capture":"room-target"}/>}
            {col===0&&<small>{8-row}</small>}
            {row===7&&<em>{"abcdefgh"[col]}</em>}
          </button>;
        }))}</div>
        {promotion&&<div className="room-promotion">Promote to {(["q","r","b","n"] as const).map(type=><button key={type} onClick={()=>void sendMove(promotion.from,promotion.to,type)}>{pieces[chess.turn()+type]}</button>)}</div>}
        <div className="room-player"><span>♔</span><div><b>{game.whitePlayer.playerProfile?.username||"White"}</b><small>{viewerIsWhite?"You":""}</small></div><strong className={chess.turn()==="w"&&game.status==="ACTIVE"?"clock-active":""}>{clock(remaining("w"))}</strong></div>
      </div>
      <aside className="room-panel"><span className="eyebrow">GAME DETAILS</span><h2>{status}</h2><p>{game.viewerIsGuest?"Guest game · unranked. Create an account to keep a player profile and personal history.":game.status==="WAITING"?"Share this game ID with an opponent.":finished?"This game is complete.":"Moves are validated by the Chessora server. The board refreshes automatically."}</p><div className="room-moves-head"><span>MOVE HISTORY</span><span>{game.moves.length} PLY</span></div><div className="room-moves">{game.moves.length?Array.from({length:Math.ceil(game.moves.length/2)},(_,i)=><div key={i}><small>{i+1}.</small><b>{game.moves[i*2]?.san}</b><b>{game.moves[i*2+1]?.san||""}</b></div>):<p>No moves yet.</p>}</div>{game.status==="WAITING"&&viewerIsWhite&&<button className="room-action secondary" disabled={busy} onClick={()=>void gameAction("cancel")}>Cancel challenge</button>}{game.status==="ACTIVE"&&<div className="room-actions">{game.drawOfferBy&&game.drawOfferBy!==userId?<><p className="room-draw-pending">Opponent offers a draw.</p><button className="room-action" disabled={busy} onClick={()=>void gameAction("accept_draw")}>Accept draw</button><button className="room-action secondary" disabled={busy} onClick={()=>void gameAction("decline_draw")}>Decline</button></>:<button className="room-action secondary" disabled={busy||!!game.drawOfferBy} onClick={()=>void gameAction("offer_draw")}>{game.drawOfferBy===userId?"Draw offer sent":"Offer draw"}</button>}<button className="room-action danger" disabled={busy} onClick={()=>void gameAction("resign")}>Resign</button></div>}<button className="room-refresh" onClick={()=>void refresh()}><RefreshCw size={14}/> Sync now</button>{error&&<p className="auth-error" role="alert">{error}</p>}<small className="room-id">GAME ID · {game.id}</small></aside></div>
    </section>
  </main>;
}
