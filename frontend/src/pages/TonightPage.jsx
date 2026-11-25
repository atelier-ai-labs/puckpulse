import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { API_BASE } from "../config.js";
import { useFetchWithStatus } from "../hooks/useFetchWithStatus.js";
import { todayISO } from "../utils/dates.js";
import { starter } from "../utils/goalies.js";
import { copyFor, formLine, injuryList, oddsMove, travelLine } from "../utils/tonight.js";
import { framingFor, trackGameOpen } from "../utils/tonightTest.js";

const NOT_STARTED = new Set(["FUT", "PRE"]);
const SIDES = ["away", "home"];
const startTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const sectionId = (gameId) => `game-${gameId}`;

// The brief agent writes 3 Markdown bullets; shown as plain text, as on the game page.
const bullets = (text) =>
  (text || "").split("\n").map((l) => l.trim().replace(/^[-*]\s+/, "").replace(/\*\*/g, "")).filter(Boolean);

// One fact, one line per team: "PIT  2nd night of a back-to-back · ...".
function TeamRows({ label, teams, lines }) {
  const rows = SIDES.map((side) => [teams[side], lines[side]]).filter(([, line]) => line);
  if (rows.length === 0) return null;
  return (
    <div className="tonight-fact">
      <dt>{label}</dt>
      {rows.map(([team, line]) => (
        <dd key={team}><span className="tonight-team">{team}</span> {line}</dd>
      ))}
    </div>
  );
}

function Injuries({ teams, injuries }) {
  const lines = {};
  for (const side of SIDES) {
    const { shown, more } = injuryList(injuries?.[side]);
    lines[side] = shown.length ? `${shown.join(", ")}${more ? `, +${more} more` : ""}` : "None reported";
  }
  return <TeamRows label="Injuries" teams={teams} lines={lines} />;
}

function GameFacts({ game, board }) {
  const teams = { away: game.awayTeam.abbrev, home: game.homeTeam.abbrev };
  const net = Object.fromEntries(SIDES.map((side) => {
    const g = starter(board, side);
    return [side, g ? `${g.name} (${g.note})` : "Not known yet"];
  }));
  const rest = Object.fromEntries(SIDES.map((side) => [side, travelLine(board.travel?.[side], board.b2b?.[side])]));
  const form = Object.fromEntries(SIDES.map((side) => [side, formLine(board.form?.[side])]));
  const odds = oddsMove(board.odds_move, teams.away, teams.home);
  const brief = bullets(board.brief);
  return (
    <div className="tonight-body">
      <dl className="tonight-facts">
        <TeamRows label="In net" teams={teams} lines={net} />
        <Injuries teams={teams} injuries={board.injuries} />
        <TeamRows label="Rest and travel" teams={teams} lines={rest} />
        <TeamRows label="Recent form" teams={teams} lines={form} />
        <div className="tonight-fact">
          <dt>Odds</dt>
          {odds ? (
            <>
              <dd className="tonight-prices">{odds.prices}</dd>
              <dd className="tonight-muted">{odds.moved}</dd>
            </>
          ) : <dd className="tonight-muted">No lines yet.</dd>}
        </div>
        {brief.length > 0 && (
          <div className="tonight-fact">
            <dt>Pregame brief</dt>
            <dd><ul className="tonight-brief">{brief.map((b) => <li key={b}>{b}</li>)}</ul></dd>
          </div>
        )}
      </dl>
      <Link className="accent-link tonight-more" to={`/games/${game.id}`}>Full preview and lineups ›</Link>
    </div>
  );
}

function GameSection({ game, board, open, onToggle }) {
  const notStarted = NOT_STARTED.has(game.gameState);
  const away = game.awayTeam.abbrev;
  const home = game.homeTeam.abbrev;
  const bodyId = `${sectionId(game.id)}-facts`;
  return (
    <li id={sectionId(game.id)} className={notStarted ? "tonight-game" : "tonight-game tonight-game-started"}>
      <button type="button" className="tonight-head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="tonight-matchup">{away} <span className="bets-at">@</span> {home}</span>
        <span className="bets-time">{notStarted ? startTime(game.startTimeUTC) : game.gameState === "OFF" || game.gameState === "FINAL" ? "Final" : "Started"}</span>
      </button>
      {open && <div id={bodyId}><GameFacts game={game} board={board} /></div>}
    </li>
  );
}

// /tonight: every game tonight, the facts behind each in one place (PP-011).
// ?for=bet or ?for=lineup picks the framing (the audience test's tagged
// links); /tonight#game-{id} opens that game, which is where a tap on an
// upcoming game on the scoreboard lands.
export default function TonightPage() {
  const today = todayISO();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [framing] = useState(() => framingFor(searchParams.get("for"), today));
  const copy = copyFor(framing);
  const { data: scoreboard, status: scoreStatus } = useFetchWithStatus(`${API_BASE}/games/date/${today}`);
  const { data: tonight, status } = useFetchWithStatus(`${API_BASE}/tonight?date=${today}`);
  // A game the reader opened or closed here; otherwise the one the link points at is open.
  const [toggled, setToggled] = useState({});
  const linked = location.hash.match(/^#game-(\d+)$/)?.[1] ?? null;
  const boards = tonight?.games || {};
  const games = (scoreboard?.games || [])
    .filter((g) => boards[String(g.id)])
    .sort((a, b) => NOT_STARTED.has(b.gameState) - NOT_STARTED.has(a.gameState) || a.startTimeUTC.localeCompare(b.startTimeUTC));
  const loading = status === "loading" || scoreStatus === "loading";
  const linkedReady = linked != null && games.some((g) => String(g.id) === linked);

  // Opening a game from a link (usually the scoreboard): scroll to it and count the open.
  const via = location.state?.via || "link";
  useEffect(() => {
    if (!linkedReady) return undefined;
    trackGameOpen(framing, linked, via);
    // Next frame: after the app's scroll-to-top for a new page has run.
    const frame = requestAnimationFrame(() =>
      document.getElementById(sectionId(linked))?.scrollIntoView?.({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [linkedReady, linked, framing, via, location.key]);

  const isOpen = (id) => toggled[id] ?? String(id) === linked;
  const toggle = (id) => {
    const next = !isOpen(id);
    setToggled((t) => ({ ...t, [id]: next }));
    if (next) trackGameOpen(framing, id, "page");
  };

  return (
    <main className="page tonight-page">
      <div className="page-header"><h1>{copy.title}</h1></div>
      <p className="page-subtitle">{copy.intro}</p>
      {status === "error" ? (
        <p className="bets-note">Couldn&apos;t load tonight&apos;s games.</p>
      ) : loading && games.length === 0 ? (
        <p className="bets-note">Loading…</p>
      ) : games.length === 0 ? (
        <p className="bets-note">No games tonight. <Link className="accent-link" to="/">See the schedule.</Link></p>
      ) : (
        <ul className="tonight-list">
          {games.map((g) => (
            <GameSection key={g.id} game={g} board={boards[String(g.id)]} open={isOpen(g.id)} onToggle={() => toggle(g.id)} />
          ))}
        </ul>
      )}
      <section className="bets-about">
        <p className="bets-legal">
          In net: <em>confirmed</em> or <em>expected</em> is the word from beat reporters via RotoWire, <em>NHL.com</em> is its
          projected lineup, and a percentage is PuckPulse&apos;s own projection. Injuries from ESPN. Recent form is from each
          team&apos;s expected goals (the quality of its chances), so it shows what the record can hide. Odds are the
          sportsbooks&apos; typical moneylines via The Odds API, checked each morning and about 15 minutes before puck drop.
        </p>
        <p className="bets-legal">
          Research, not advice: PuckPulse doesn&apos;t make picks. Starters and lineups can change until puck drop. 21+. If you
          bet, bet responsibly: gambling problem? Call <span className="nowrap">1-800-GAMBLER</span>.
        </p>
      </section>
    </main>
  );
}
