import { ArrowUpRight, BrainCircuit, Crown, Swords, Trophy } from "lucide-react";

const features = [
  { icon: Swords, title: "Play your way", copy: "Fast matchmaking, reliable clocks, and fair competitive games." },
  { icon: BrainCircuit, title: "Understand every move", copy: "Engine-backed analysis and coaching designed to explain, not just score." },
  { icon: Trophy, title: "Climb together", copy: "Rated arenas, tournaments, clubs, and meaningful progression." },
];

export default function HomePage() {
  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="#"><span className="brand-mark">C</span> chessora</a>
        <div className="nav-links"><a href="/multiplayer">Multiplayer</a><a href="/play">Practice</a><a href="#features">Features</a><a href="#vision">Our vision</a></div>
        <div className="nav-actions"><a className="nav-login" href="/login">Sign in</a><a className="nav-cta" href="/register">Join Chessora <ArrowUpRight size={15} /></a></div>
      </nav>

      <section className="hero" id="vision">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> THE NEXT MOVE IN ONLINE CHESS</div>
          <h1>Think beyond<br /><em>the board.</em></h1>
          <p className="hero-text">A sharper place to play, learn, and compete. Jump into an unranked guest game instantly, or create an account to build your chess profile.</p>
          <div className="hero-actions">
            <a className="primary-button" href="/multiplayer">Play as guest <ArrowUpRight size={17} /></a>
            <a className="text-link" href="#features">Discover the platform</a>
          </div>
          <div className="hero-note"><span className="note-line" /> PLAY · LEARN · MASTER</div>
        </div>

        <div className="board-stage" aria-label="Decorative chess position">
          <div className="board-glow" />
          <div className="board-frame">
            <div className="board">
              {["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","·","♟","♟","♟","♟","·","·","·","♟","·","·","·","·","·","·","♟","·","·","♘","·","·","·","·","·","·","·","·","·","·","·","·","♙","·","·","·","·","·","♙","♙","·","♙","♙","♙","♙","♙","♖","♘","♗","♕","♔","♗","·","♖"].map((piece, i) => (
                <div key={i} className={`square ${(Math.floor(i / 8) + i % 8) % 2 ? "dark" : "light"} ${piece === "♘" && i === 29 ? "last-move" : ""}`}>
                  <span className={piece === "·" ? "empty-piece" : i < 16 ? "black-piece" : "white-piece"}>{piece === "·" ? "" : piece}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="floating-card rating-card"><span className="mini-label">YOUR NEXT CHALLENGE</span><strong>1800 <small>RATING</small></strong><div className="rating-track"><i /></div><span className="rating-caption">Every game is progress.</span></div>
          <div className="floating-card insight-card"><span className="insight-icon"><BrainCircuit size={17} /></span><div><b>Think deeper.</b><small>Learn from every position.</small></div></div>
          <div className="board-coordinate">64 SQUARES · INFINITE POSSIBILITIES</div>
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading"><span className="eyebrow">MADE FOR EVERY MOVE</span><h2>More than a place to play.</h2></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, copy }, i) => <article className="feature" key={title}><div className="feature-top"><span>0{i + 1}</span><Icon size={21} strokeWidth={1.6} /></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="closing" id="get-started"><div><Crown size={20} /><span className="eyebrow">THE GAME IS ALWAYS EVOLVING</span></div><h2>Your next chapter<br />starts with a move.</h2><p>Chessora is being built. The board is waiting.</p><a className="primary-button" href="https://github.com/Rololol/Chessora">Follow the build <ArrowUpRight size={17} /></a></section>
      <footer><a className="brand" href="#"><span className="brand-mark">C</span> chessora</a><span>THINK BEYOND THE BOARD.</span><span>© {new Date().getFullYear()} CHESSORA</span></footer>
    </main>
  );
}
