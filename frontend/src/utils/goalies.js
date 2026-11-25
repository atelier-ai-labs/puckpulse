import { formatPct } from "./odds.js";

const lastName = (name) => name.split(" ").slice(1).join(" ") || name;

// A team's starter by the best word so far, from a /bets (or /tonight) board:
// a beat reporter's (via RotoWire: "confirmed" or "expected"), then NHL.com's
// projected lineup, then our projection with its chance. {name, note} or null.
export function starter(board, side) {
  const reported = board.reported_starters?.[side];
  if (reported) return { name: lastName(reported.name), note: reported.status };
  const nhl = board.nhl_starters?.[side];
  if (nhl) return { name: lastName(nhl), note: "NHL.com" };
  const top = board.goalies?.[side]?.[0];
  return top ? { name: lastName(top.name), note: formatPct(top.prob) } : null;
}
