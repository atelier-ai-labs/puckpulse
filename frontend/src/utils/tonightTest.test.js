import { daysBetween, framingFor, recordReturnCheck, returnToCheck, trackGameOpen } from "./tonightTest.js";

describe("the PP-011 audience test", () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.umami = { track: vi.fn() };
  });
  afterEach(() => delete globalThis.umami);

  it("puts a browser in the group of the first tagged link it arrives on, once", () => {
    expect(framingFor("lineup", "2026-11-25")).toBe("lineup");
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-arrive", { framing: "lineup" });
    // A later link from the other group doesn't move it, or count it twice.
    expect(framingFor("bet", "2026-11-26")).toBe("lineup");
    expect(framingFor(null, "2026-11-26")).toBe("lineup");
    expect(globalThis.umami.track).toHaveBeenCalledTimes(1);
  });

  it("leaves untagged visitors out of the test", () => {
    expect(framingFor(null, "2026-11-25")).toBeNull();
    expect(framingFor("picks", "2026-11-25")).toBeNull();
    expect(globalThis.umami.track).not.toHaveBeenCalled();
    expect(returnToCheck("2026-11-26")).toBeNull();
  });

  it("counts a return on a later game day, once", () => {
    framingFor("bet", "2026-11-25");
    expect(returnToCheck("2026-11-25")).toBeNull(); // the same day isn't a return
    recordReturnCheck("2026-11-27", true);
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-return", { framing: "bet", days: 2, joined: "2026-11-25" });
    recordReturnCheck("2026-11-28", true);
    expect(globalThis.umami.track.mock.calls.filter(([name]) => name === "tonight-return")).toHaveLength(1);
  });

  it("doesn't count a day without games, and checks it only once", () => {
    framingFor("bet", "2026-11-25");
    recordReturnCheck("2026-11-26", false);
    expect(returnToCheck("2026-11-26")).toBeNull();
    expect(returnToCheck("2026-11-27")).toMatchObject({ framing: "bet", days: 2 });
    expect(globalThis.umami.track).not.toHaveBeenCalledWith("tonight-return", expect.anything());
  });

  it("stops counting after the two weeks", () => {
    framingFor("lineup", "2026-11-25");
    expect(returnToCheck("2026-12-09")).toMatchObject({ days: 14 });
    expect(returnToCheck("2026-12-10")).toBeNull();
  });

  it("counts days across months", () => {
    expect(daysBetween("2026-11-28", "2026-12-03")).toBe(5);
  });

  it("names the framing on game opens", () => {
    trackGameOpen(null, 7, "page");
    expect(globalThis.umami.track).toHaveBeenCalledWith("tonight-game-open", { framing: "none", game: "7", from: "page" });
  });
});
