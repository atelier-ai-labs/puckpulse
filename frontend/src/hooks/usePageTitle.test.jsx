import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import usePageTitle from "./usePageTitle.js";

function Probe() {
  usePageTitle();
  return null;
}

describe("usePageTitle", () => {
  it("sets the title for the route", () => {
    render(<MemoryRouter initialEntries={["/teams/PIT"]}><Probe /></MemoryRouter>);
    expect(document.title).toBe("Pittsburgh Penguins playoff odds & stats | PuckPulse");
  });

  it("uses the page name", () => {
    render(<MemoryRouter initialEntries={["/playoffs"]}><Probe /></MemoryRouter>);
    expect(document.title).toBe("NHL Playoff Odds | PuckPulse");
  });

  it("points the canonical tag at the clean puckpulse.io URL", () => {
    render(<MemoryRouter initialEntries={["/teams/pit/?ref=x"]}><Probe /></MemoryRouter>);
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe("https://puckpulse.io/teams/PIT");
  });

  it("updates the one canonical tag on navigation instead of adding another", () => {
    render(<MemoryRouter initialEntries={["/standings"]}><Probe /></MemoryRouter>);
    render(<MemoryRouter initialEntries={["/news"]}><Probe /></MemoryRouter>);
    const links = document.head.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe("https://puckpulse.io/news");
  });
});
