"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { ArrowLeft, RotateCcw, Undo2, Settings } from "lucide-react";
import { useEffect } from "react";
import { readSettings, playChessSound, type ChessoraSettings } from "@/lib/settings";
import Link from "next/link";

const glyph: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

export default function ChessBoard() {
  const [pgn, setPgn] = useState("");
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [notice, setNotice] = useState("White to move");
  const [prefs,setPrefs] = useState<ChessoraSettings | null>(null);
  useEffect(()=>{const load=()=>setPrefs(readSettings());load();window.addEventListener("chessora-settings",load);return()=>window.removeEventListener("chessora-settings",load)},[]);

  const game = useMemo(() => {
    const position = new Chess();
    if (pgn) position.loadPgn(pgn);
    return position;
  }, [pgn]);
  const history = game.history({ verbose: true });
  const legalTargets = selected
    ? game.moves({ square: selected, verbose: true }).map((move) => move.to)
    : [];
  const lastMove = history.at(-1);
  const finished = game.isGameOver();

  function statusText(position: Chess) {
    if (position.isCheckmate()) return `Checkmate — ${position.turn() === "w" ? "Black" : "White"} wins.`;
    if (position.isStalemate()) return "Draw — stalemate.";
    if (position.isThreefoldRepetition()) return "Draw — threefold repetition.";
    if (position.isInsufficientMaterial()) return "Draw — insufficient material.";
    if (position.isDraw()) return "Draw.";
    return `${position.turn() === "w" ? "White" : "Black"} to move${position.isCheck() ? " · Check" : ""}`;
  }

  function makeMove(from: Square, to: Square, promotion = "q") {
    const next = new Chess(game.fen());
    try {
      const moved = next.move({ from, to, promotion });
      playChessSound(moved.captured ? "capture" : "move");
      setPgn(next.pgn());
      setNotice(statusText(next));
      setSelected(null);
      setPendingPromotion(null);
    } catch {
      setNotice("That move is not legal.");
    }
  }

  function chooseSquare(square: Square) {
    if (finished || pendingPromotion) return;
    const piece = game.get(square);
    if (selected) {
      const candidate = game.moves({ square: selected, verbose: true }).find((move) => move.to === square);
      if (candidate) {
        if (candidate.flags.includes("p")) {
          setPendingPromotion({ from: selected, to: square });
          return;
        }
        makeMove(selected, square);
        return;
      }
    }
    if (piece && piece.color === game.turn()) {
      setSelected(square);
      setNotice(`${square.toUpperCase()} selected`);
    } else {
      setSelected(null);
      setNotice(statusText(game));
    }
  }

  function undo() {
    if (!history.length) return;
    const next = new Chess();
    if (pgn) next.loadPgn(pgn);
    next.undo();
    setPgn(next.pgn());
    setSelected(null);
    setPendingPromotion(null);
    setNotice(statusText(next));
  }

  function restart() {
    setPgn("");
    setSelected(null);
    setPendingPromotion(null);
    setNotice("White to move");
  }

  return (
    <main className="play-shell">
      <header className="play-nav">
        <Link className="brand" href="/"><span className="brand-mark">C</span> chessora</Link>
        <span className="play-kicker">PRACTICE BOARD · LOCAL GAME</span>
        <div className="play-nav-actions"><Link className="back-link" href="/settings"><Settings size={15}/> Settings</Link><Link className="back-link" href="/"><ArrowLeft size={15} /> Home</Link></div>
      </header>

      <section className="play-layout">
        <div className="play-main">
          <div className="play-heading">
            <div><span className="eyebrow">YOUR FIRST GAME</span><h1>Make your move.</h1></div>
            <span className={`turn-indicator ${game.turn() === "w" ? "white-turn" : "black-turn"}`}><i /> {game.turn() === "w" ? "White" : "Black"} to move</span>
          </div>

          <div className="live-board-wrap">
            {prefs?.coordinates!==false && <div className="board-coords left-coords">{[8,7,6,5,4,3,2,1].map((rank) => <span key={rank}>{rank}</span>)}</div>}
            <div className={`live-board ${prefs?.pieces==="minimal"?"pieces-minimal":""}`} role="grid" aria-label="Interactive chessboard">
              {game.board().flatMap((rank, row) => rank.map((piece, col) => {
                const square = `${"abcdefgh"[col]}${8-row}` as Square;
                const isLight = (row + col) % 2 === 0;
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);
                const isLast = lastMove?.from === square || lastMove?.to === square;
                return (
                  <button
                    type="button"
                    role="gridcell"
                    aria-label={`${square}, ${piece ? (piece.color === "w" ? "white" : "black") + " " + piece.type : "empty"}`}
                    key={square}
                    onClick={() => chooseSquare(square)}
                    className={`live-square ${prefs?.board==="blue"?"ocean":prefs?.board==="wood"?"wood":prefs?.board==="green"?"forest":isLight?"light":"dark"} ${isSelected ? "selected" : ""} ${isLast ? "last" : ""}`}
                  >
                    {piece && <span className={piece.color === "w" ? "piece-white" : "piece-black"}>{prefs?.pieces==="minimal" ? piece.type.toUpperCase() : glyph[piece.color + piece.type]}</span>}
                    {isTarget && <span className={piece ? "capture-dot" : "move-dot"} />}
                    {col === 0 && <small className="rank-label">{8-row}</small>}
                    {row === 7 && <small className="file-label">{ "abcdefgh"[col] }</small>}
                  </button>
                );
              }))}
            </div>
            {prefs?.coordinates!==false && <div className="board-coords right-coords">{[8,7,6,5,4,3,2,1].map((rank) => <span key={rank}>{rank}</span>)}</div>}
          </div>
          {prefs?.coordinates!==false && <div className="file-coords">{[..."abcdefgh"].map((file) => <span key={file}>{file}</span>)}</div>}

          {pendingPromotion && <div className="promotion-panel"><span>Promote pawn to</span>{(["q","r","b","n"] as const).map((type) => <button key={type} onClick={() => makeMove(pendingPromotion.from, pendingPromotion.to, type)}>{glyph[game.turn() + type]}</button>)}<button className="cancel-promotion" onClick={() => setPendingPromotion(null)}>Cancel</button></div>}
          <div className="board-status"><span className="status-dot" />{notice}</div>
        </div>

        <aside className="game-panel">
          <div className="panel-top"><span className="eyebrow">GAME CONTROL</span><span className="local-tag">LOCAL</span></div>
          <h2>Casual game</h2>
          <p className="panel-copy">Play both sides on this device. Every move is checked against the full chess rules.</p>
          <div className="player-card active-player"><span className="player-piece">♔</span><div><b>White</b><small>{game.turn() === "w" ? "To move" : "Waiting"}</small></div><span className="player-rating">YOU</span></div>
          <div className="player-card"><span className="player-piece black-king">♚</span><div><b>Black</b><small>{game.turn() === "b" ? "To move" : "Waiting"}</small></div><span className="player-rating">YOU</span></div>
          <div className="move-list-head"><span>MOVE HISTORY</span><span>{history.length} PLY</span></div>
          <div className="move-list">
            {history.length === 0 ? <p className="empty-history">Your moves will appear here.</p> : Array.from({ length: Math.ceil(history.length / 2) }, (_, index) => (
              <div className="move-row" key={index}><span>{index + 1}.</span><b>{history[index * 2]?.san ?? ""}</b><b>{history[index * 2 + 1]?.san ?? ""}</b></div>
            ))}
          </div>
          <div className="game-actions">
            <button type="button" onClick={undo} disabled={!history.length}><Undo2 size={16} /> Undo move</button>
            <button type="button" onClick={restart}><RotateCcw size={16} /> New game</button>
          </div>
          <div className="rules-note">LEGAL MOVE VALIDATION <span>·</span> CASTLING <span>·</span> EN PASSANT <span>·</span> PROMOTION</div>
        </aside>
      </section>
      <footer className="play-footer"><span>CHESSORA · THINK BEYOND THE BOARD</span><span>LOCAL GAME · NO ACCOUNT REQUIRED</span></footer>
    </main>
  );
}
