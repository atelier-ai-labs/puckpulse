import { COPY, copyFor, formLine, injuryList, oddsMove, travelLine } from "./tonight.js";

describe("Tonight's wording", () => {
  it("has a framing for each audience and a neutral default", () => {
    expect(copyFor("bet").title).toBe("Before you bet");
    expect(copyFor("lineup").title).toBe("Before you set your lineup");
    expect(copyFor(null)).toBe(COPY.none);
  });

  it("never makes picks", () => {
    for (const { title, intro } of Object.values(COPY)) {
      expect(`${title} ${intro}`).not.toMatch(/\block|best bet|pick of/i);
    }
  });
});

describe("travelLine", () => {
  it("describes a tired road team", () => {
    expect(travelLine({ rest_days: 0, last_home: false, last_opponent: "BOS", miles: 1190, road_trip_game: 3 }, true))
      .toBe("2nd night of a back-to-back · last played at BOS, 1,190 mi away · game 3 of a road trip");
  });

  it("describes a rested home team", () => {
    expect(travelLine({ rest_days: 2, last_home: true, last_opponent: "MTL", miles: 0, road_trip_game: 0 }, false))
      .toBe("2 days of rest · last played at home vs MTL");
    expect(travelLine({ rest_days: 1, last_home: true, last_opponent: "MTL", miles: 0, road_trip_game: 0 }, false))
      .toMatch(/^1 day of rest/);
  });

  it("falls back to the back-to-back flag alone", () => {
    expect(travelLine(null, true)).toBe("2nd night of a back-to-back");
    expect(travelLine(null, false)).toBeNull();
  });
});

describe("formLine", () => {
  it("goes beyond the record", () => {
    expect(formLine({ games: 10, xg_pct: 0.541, goals_for: 34, goals_against: 16, scoring_vs_xg: 8, allowing_vs_xg: -8 }))
      .toBe("Last 10: 54% of the expected goals · goals 34–16 · scoring +8.0 vs its chances · goalies saving 8.0 more than expected");
  });

  it("leaves out small gaps from expected", () => {
    expect(formLine({ games: 5, xg_pct: 0.5, goals_for: 10, goals_against: 10, scoring_vs_xg: 0.4, allowing_vs_xg: 1.5 }))
      .toBe("Last 5: 50% of the expected goals · goals 10–10 · allowing 1.5 more than expected");
    expect(formLine(null)).toBeNull();
  });
});

describe("oddsMove", () => {
  const open = { home_prob: 0.58, home_line: -140, away_line: 120 };

  it("shows the move since morning", () => {
    const move = oddsMove({ open, latest: { home_prob: 0.61, home_line: -160, away_line: 135 }, home_pts: 3 }, "PIT", "COL");
    expect(move.prices).toBe("PIT +120 → +135 · COL −140 → −160");
    expect(move.moved).toBe("Moved 3.0 points toward COL since morning (COL 58% → 61%).");
  });

  it("calls a small move a small move", () => {
    expect(oddsMove({ open, latest: { ...open, home_prob: 0.585 }, home_pts: 0.5 }, "PIT", "COL").moved).toMatch(/^Barely moved/);
  });

  it("shows the morning's lines before the second check", () => {
    const move = oddsMove({ open, latest: null, home_pts: null }, "PIT", "COL");
    expect(move.prices).toBe("PIT +120 · COL −140");
    expect(move.moved).toMatch(/15 minutes before puck drop/);
    expect(oddsMove(null, "PIT", "COL")).toBeNull();
  });
});

describe("injuryList", () => {
  it("keeps who's out or day-to-day, in the API's order, and counts the rest", () => {
    const rows = ["Out", "Injured Reserve", "Day-To-Day", "Out", "Out", "Questionable"].map((status, i) => ({ player: `P${i}`, status }));
    expect(injuryList(rows)).toEqual({ shown: ["P0 (out)", "P1 (IR)", "P2 (day-to-day)", "P3 (out)"], more: 1 });
    expect(injuryList(undefined)).toEqual({ shown: [], more: 0 });
  });
});
