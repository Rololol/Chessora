"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import { defaultSettings, readSettings, saveSettings, type ChessoraSettings } from "@/lib/settings";

const boards = [{ id:"classic", name:"Classic", light:"#e8edf0", dark:"#7796ad" },{ id:"blue", name:"Ocean", light:"#dee8f0", dark:"#6b91b5" },{ id:"wood", name:"Wood", light:"#f0d9b5", dark:"#b58863" },{ id:"green", name:"Forest", light:"#eeeed2", dark:"#769656" }] as const;
const pieces = [{ id:"classic", name:"Classic", white:"♔ ♕ ♖ ♗ ♘ ♙", black:"♚ ♛ ♜ ♝ ♞ ♟" },{ id:"minimal", name:"Minimal", white:"♔ ♕ ♖ ♗ ♘ ♙", black:"♚ ♛ ♜ ♝ ♞ ♟" }] as const;
export default function SettingsPage() {
  const [value,setValue]=useState<ChessoraSettings>(defaultSettings);
  useEffect(()=>setValue(readSettings()),[]);
  function update(patch:Partial<ChessoraSettings>){const next={...value,...patch};setValue(next);saveSettings(next);}
  return <main className="settings-shell">
    <header className="lobby-nav"><Link className="brand" href="/"><span className="brand-mark">C</span> chessora</Link><div><Link href="/multiplayer">Play</Link><Link href="/play">Practice</Link></div></header>
    <section className="settings-content">
      <Link className="profile-back" href="/multiplayer"><ArrowLeft size={15}/> Back to chess</Link>
      <span className="eyebrow">PREFERENCES</span><h1>Settings</h1><p className="settings-intro">Make the board feel like yours. Your preferences are saved in this browser.</p>
      <section className="settings-section"><div><h2>Board theme</h2><p>Choose the colors for your games.</p></div><div className="theme-grid">{boards.map(board=><button key={board.id} className={value.board===board.id?"theme-option active":"theme-option"} onClick={()=>update({board:board.id})}><span className="theme-preview"><i style={{background:board.light}}/><i style={{background:board.dark}}/><i style={{background:board.dark}}/><i style={{background:board.light}}/></span><b>{board.name}</b></button>)}</div></section>
      <section className="settings-section"><div><h2>Piece set</h2><p>Choose how the pieces are displayed.</p></div><div className="piece-grid">{pieces.map(set=><button key={set.id} className={value.pieces===set.id?"piece-option active":"piece-option"} onClick={()=>update({pieces:set.id})}><span className="piece-preview-row">{set.id==="minimal"?"K Q R B N P":set.white}</span><span className="piece-preview-row">{set.id==="minimal"?"k q r b n p":set.black}</span><b>{set.name}</b></button>)}</div></section>
      <section className="settings-section"><div><h2>Sound</h2><p>Control move and capture sounds.</p></div><div className="settings-toggles"><label><span><Volume2 size={17}/> Sound effects</span><input type="checkbox" checked={value.sound} onChange={e=>update({sound:e.target.checked})}/></label><label><span>Move sound</span><input type="checkbox" checked={value.moveSound} disabled={!value.sound} onChange={e=>update({moveSound:e.target.checked})}/></label><label><span>Capture sound</span><input type="checkbox" checked={value.captureSound} disabled={!value.sound} onChange={e=>update({captureSound:e.target.checked})}/></label></div></section>
      <section className="settings-section"><div><h2>Board display</h2><p>Keep coordinates visible around the board.</p></div><label className="settings-toggle"><span>Show coordinates</span><input type="checkbox" checked={value.coordinates} onChange={e=>update({coordinates:e.target.checked})}/></label></section>
      <button className="settings-reset" onClick={()=>{setValue(defaultSettings);saveSettings(defaultSettings)}}>Reset to defaults</button>
    </section>
  </main>;
}
