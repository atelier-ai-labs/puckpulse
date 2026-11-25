import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TonightPage from "./TonightPage.jsx";

const BOARD = {
  home: "COL", away: "PIT", b2b: { home: false, away: true },
  goalies: { home: [{ name: "Mackenzie Blackwood", prob: 0.81 }], away: [{ name: "Arturs Silovs", prob: 0.62 }] },
  reported_starters: { home: null, away: { name: "Tristan Jarry", status: "confirmed" } },
  moneyline: { home: { ours: 0.6, price: -160, value: true }, away: { ours: 0.4, price: 135 } },
  odds_move: { open: { home_prob: 0.58, home_line: -140, away_line: 120 },
               latest: { home_prob: 0.61, home_line: -160, away_line: 135 }, home_pts: 3 },
  form: { home: { games: 10, xg_pct: 0.55, goals_for: 30, goals_against: 25, scoring_vs_xg: 0.2, allowing_vs_xg: 0.1 }, away: null },
  travel: { home: { rest_days: 2, last_home: true, last_opponent: "DAL", miles: 0, road_trip_game: 0 },
            away: { rest_days: 0, last_home: false, last_opponent: "UTA", miles: 371, road_trip_game: 2 } },
  injuries: { home: [], away: [{ player: "Kris Letang", status: "Out" }] },
  brief: "- COL is 6-1 at home.\n- PIT played last night.",
};
const game = (id, state = "FUT") => ({ id, gameState: state, startTimeUTC: "2026-11-26T02:00:00Z",
                                       awayTeam: { abbrev: "PIT" }, homeTeam: { abbrev: "COL" } });

function mockFetch(games, boards) {
  globalThis.fetch = vi.fn((url) => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(url.includes("/tonight") ? { games: boards } : { games }),
  }));
}

const renderAt = (entry) => render(<MemoryRouter initialEntries={[entry]}><TonightPage /></MemoryRouter>);

describe("TonightPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    globalThis.umami = { track: vi.fn() };
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => delete globalThis.umami);

  it("opens the linked game with every fact, and no picks", async () => {
    mockFetch([game(7)], { 7: BOARD });
    renderAt({ pathname: "/tonight", hash: "#game-7", state: { via: "scoreboard" } });
    const section = (await screen.findByRole("button", { name: /PIT @ COL/ })).closest("li");
    expect(section).toHaveAttribute("id", "game-7");
    expect(within(section).getByText("In net").parentElement).toHaveTextContent("PIT Jarry (confirmed)COL Blackwood (81%)");
    expect(within(section).getByText("Injuries").parentElement).toHaveTextContent("PIT Kris Letang (out)COL None reported");
    expect(within(section).getByText(/2nd night of a back-to-back · last played at UTA, 371 mi away · game 2 of a road trip/)).toBeInTheDocument();
    expect(within(section).getByText(/Last 10: 55% of the expected goals/)).toBeInTheDocument();
    expect(within(section).getByText("PIT +120 → +135 · COL −140 → −160")).toBeInTheDocument();
    expect(within(section).getByText("COL is 6-1 at home.")).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: /Full preview/ })).toHaveAttribute("href", "/games/7");
    expect(screen.queryByText(/value/i)).not.toBeInTheDocument(); // the Bets tab's value badge isn't a fact
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-game-open", { framing: "none", game: "7", from: "scoreboard" });
  });

  it("keeps other games closed until tapped, and counts the open", async () => {
    mockFetch([game(7), { ...game(8), awayTeam: { abbrev: "BOS" }, homeTeam: { abbrev: "TOR" } }], { 7: BOARD, 8: { ...BOARD, home: "TOR", away: "BOS" } });
    renderAt("/tonight#game-7");
    const other = await screen.findByRole("button", { name: /BOS @ TOR/ });
    expect(other).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(other);
    expect(other).toHaveAttribute("aria-expanded", "true");
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-game-open", { framing: "none", game: "8", from: "page" });
  });

  it.each([
    ["bet", "Before you bet"],
    ["lineup", "Before you set your lineup"],
  ])("frames the same page for ?for=%s and keeps the 21+ note", async (framing, title) => {
    mockFetch([game(7)], { 7: BOARD });
    renderAt(`/tonight?for=${framing}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-arrive", { framing });
    await screen.findByRole("button", { name: /PIT @ COL/ });
    expect(screen.getByText(/21\+/)).toHaveTextContent("1-800-GAMBLER");
  });

  it("says when there are no games", async () => {
    mockFetch([], {});
    renderAt("/tonight");
    expect(await screen.findByText(/No games tonight/)).toBeInTheDocument();
  });
});
