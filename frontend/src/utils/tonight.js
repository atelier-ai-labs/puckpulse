// The Tonight page's wording (PP-011). The two framings share the data and the
// layout; only these words change. null is a visitor who didn't come from a
// tagged link. Research, not advice: no picks, no "locks", in any framing.
import { formatPct, formatPrice } from "./odds.js";

export const COPY = {
  bet: {
    title: "Before you bet",
    intro: "Tonight's games, and what moves a line: who's in net, who's out, who's tired, how each team is really playing, and how the odds have moved since morning. Research, not picks.",
  },
  lineup: {
    title: "Before you set your lineup",
    intro: "Tonight's games, and what decides who plays and who sits: who's in net, who's out, who's tired, how each team is really playing, and how the odds have moved since morning. Research, not picks.",
  },
  none: {
    title: "Tonight",
    intro: "Tonight's games, and the facts behind each one: who's in net, who's out, who's tired, how each team is really playing, and how the odds have moved since morning. Research, not picks.",
  },
};

export const copyFor = (framing) => COPY[framing] || COPY.none;

const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "2nd night of a back-to-back · last played at BOS, 190 mi away · game 3 of a road trip"
export function travelLine(travel, b2b) {
  if (!travel) return b2b ? "2nd night of a back-to-back" : null;
  const parts = [];
  parts.push(b2b || travel.rest_days === 0 ? "2nd night of a back-to-back" : `${plural(travel.rest_days, "day")} of rest`);
  const where = travel.last_home ? `last played at home vs ${travel.last_opponent}` : `last played at ${travel.last_opponent}`;
  parts.push(travel.miles ? `${where}, ${travel.miles.toLocaleString()} mi away` : where);
  if (travel.road_trip_game >= 2) parts.push(`game ${travel.road_trip_game} of a road trip`);
  return parts.join(" · ");
}

// "Last 10: 54% of the expected goals · goals 31–25 · scoring +3.1 vs its chances · goalies saving 2.0 more than expected"
export function formLine(form) {
  if (!form) return null;
  const parts = [`Last ${form.games}: ${form.xg_pct != null ? `${formatPct(form.xg_pct)} of the expected goals` : "no expected goals yet"}`,
    `goals ${form.goals_for}–${form.goals_against}`];
  if (Math.abs(form.scoring_vs_xg) >= 1) parts.push(`scoring ${signed(form.scoring_vs_xg)} vs its chances`);
  if (Math.abs(form.allowing_vs_xg) >= 1) {
    parts.push(form.allowing_vs_xg < 0
      ? `goalies saving ${Math.abs(form.allowing_vs_xg).toFixed(1)} more than expected`
      : `allowing ${form.allowing_vs_xg.toFixed(1)} more than expected`);
  }
  return parts.join(" · ");
}

// The books' moneylines this morning and now, and which way they moved.
// {prices: "PIT +120 → +135 · COL −140 → −160", chance: "...", moved: "..."} or null without lines.
export function oddsMove(move, away, home) {
  if (!move?.open) return null;
  const { open, latest } = move;
  const arrow = (a, b) => (latest ? `${formatPrice(a)} → ${formatPrice(b)}` : formatPrice(a));
  const prices = `${away} ${arrow(open.away_line, latest?.away_line)} · ${home} ${arrow(open.home_line, latest?.home_line)}`;
  if (!latest) return { prices, moved: "This morning's lines. The next check is about 15 minutes before puck drop." };
  const pts = move.home_pts;
  const toward = pts > 0 ? home : away;
  const moved = Math.abs(pts) < 1
    ? `Barely moved since morning (${home} ${formatPct(open.home_prob)} → ${formatPct(latest.home_prob)}).`
    : `Moved ${Math.abs(pts).toFixed(1)} points toward ${toward} since morning (${home} ${formatPct(open.home_prob)} → ${formatPct(latest.home_prob)}).`;
  return { prices, moved };
}

const SERIOUS = ["injured reserve", "out", "day-to-day"];

// A team's injuries, worst first (the API's order), as short "Name (status)" strings, at most `max`.
export function injuryList(injuries = [], max = 4) {
  const rows = injuries.filter((r) => r.player && SERIOUS.includes((r.status || "").toLowerCase()));
  const shown = rows.slice(0, max).map((r) => `${r.player} (${r.status.toLowerCase() === "injured reserve" ? "IR" : r.status.toLowerCase()})`);
  return { shown, more: rows.length - shown.length };
}
