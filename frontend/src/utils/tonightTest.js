// PP-011's two-audience test: the Tonight page in two framings, "before you
// bet" and "before you set your lineup", each with its own tagged link
// (/tonight?for=bet or ?for=lineup). The first tagged link a browser arrives
// on puts it in that group for good (saved in this browser only, nothing
// personal), and it keeps seeing that framing. The rule for reading the
// result is in docs/PP-011-audience-test.md.
//
// Umami events, each sent at most once per browser, so event counts are
// visitor counts:
//   tonight-arrive {framing}: joined a group (n),
//   tonight-return {framing, days}: came back on a later game day within
//     the test window (x).
// tonight-game-open {framing, game, from} counts games opened on the page.
import { track } from "./analytics.js";
import { shiftDate } from "./dates.js";

export const FRAMINGS = ["bet", "lineup"];
export const TEST_DAYS = 14;
const KEY = "puckpulse.tonightTest";

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && FRAMINGS.includes(saved.framing) ? saved : null;
  } catch {
    return null;
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the visit still works, it just isn't counted.
  }
}

// The framing to show: this browser's group if it has one, else the link's
// (joining that group), else null (an untagged visitor: neutral wording).
export function framingFor(param, today) {
  const saved = read();
  if (saved) return saved.framing;
  if (!FRAMINGS.includes(param)) return null;
  write({ framing: param, day: today });
  track("tonight-arrive", { framing: param });
  return param;
}

// Days from one "YYYY-MM-DD" to a later one.
export function daysBetween(from, to) {
  let days = 0;
  for (let d = from; d < to && days <= 366; d = shiftDate(d, 1)) days += 1;
  return days;
}

// Whether today could count as this browser's return: it's in a group, hasn't
// returned yet, and today is a later day inside the window. Checked at most
// once a day (whether today is a game day takes a fetch).
export function returnToCheck(today) {
  const saved = read();
  if (!saved || saved.returned || saved.checked === today || today <= saved.day) return null;
  const days = daysBetween(saved.day, today);
  return days <= TEST_DAYS ? { ...saved, days } : null;
}

// Record today's check; a game day counts as the return.
export function recordReturnCheck(today, isGameDay) {
  const due = returnToCheck(today);
  if (!due) return;
  const { days, ...saved } = due;
  if (isGameDay) {
    write({ ...saved, checked: today, returned: today });
    track("tonight-return", { framing: saved.framing, days });
  } else {
    write({ ...saved, checked: today });
  }
}

export function trackGameOpen(framing, gameId, from) {
  track("tonight-game-open", { framing: framing || "none", game: String(gameId), from });
}
