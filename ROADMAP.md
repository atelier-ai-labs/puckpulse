# PuckPulse roadmap

**Last reviewed:** 2026-11-20. This file follows the Atelier AI Labs roadmap standard (v1.0). Atelier HQ reads
it to suggest what to work on, so every item uses the same fields.

## Vision

PuckPulse should be the place NHL bettors check before they bet: fair odds next to the best price, everything
that moves a line, and an honest track record against the closing line. The fan side (scores, standings,
alerts, pick'em) stays the base, and the site stays uncluttered. Right now the goal is growing the user base,
not making money. PuckPulse is also my main portfolio piece for applied-AI engineering jobs, so AI work that
teaches me something counts double.

**Rules for every item:**
- free tiers only (no paid AI APIs)
- no "locks" in any betting copy
- keep 21+ and 1-800-GAMBLER
- release only when no games are live

Architecture and setup are in [README.md](README.md).

## Current state

- Live at puckpulse.io. The repo moved to `atelier-ai-labs/puckpulse` on 2026-11-17.
- Working today: scores, standings (sortable by any column on desktop), goal alerts, pick'em, the Bets tab
  with fair odds (30% model / 70% market), My bets graded with closing-line value, Value of the night, Swing
  of the night, pregame briefs, the data-check investigator, post drafts, and the AI assistant with streaming
  answers, Langfuse tracing and an LLM judge in its evals.
- Recently shipped: canonical URLs for Google (11-15), retrying a failed nightly step right away (11-13), and
  totals scaled to this season's scoring plus each season's team on player pages (11-12).
- Limits: the model hasn't beaten the market yet (246 graded games on 2026-11-17, about 47 a week). Totals are
  still close to a league-average guess. Neon compute hit 80% of the free 100 hours in October.
- Next major objective: the AI-engineering items under "Next" (tool input validation, a cost for every
  question), plus smart alerts for retention.

## Roadmap

### Next

#### PP-001 — Pydantic models for the AI's tool inputs

- **Status:** planned
- **Priority:** P1
- **Size:** S · **Area:** ai
- **Goal:** Every assistant tool validates its input with a strict schema, so a bad call from the model gets a
  clear error it can read and fix.

**Why it matters:** Today a bad tool call can fail in confusing ways. This is also one of the top things
applied-AI job postings ask for.

**Requirements:**
- One Pydantic model per tool in `intelligence/app/tools.py`.
- A failed validation goes back to the model as a readable error instead of an exception.

**Done when:**
- Every tool in `intelligence/app/tools.py` validates its input with a Pydantic model.
- A bad call returns a clear error to the model.
- The evals still pass.

**Out of scope:** Changing what the tools do or which tools exist.

#### PP-002 — A token budget and a cost for every question

- **Status:** planned
- **Priority:** P1
- **Size:** M · **Area:** ai
- **Goal:** Know what one question costs in tokens and time, and stop runaway questions cleanly.

**Why it matters:** "Reliability, latency and cost" comes up in every AI engineering interview, and a cap
protects the free tiers.

**Done when:**
- Each answer records its tokens and time in Langfuse.
- A question that goes over budget stops cleanly.
- The average cost per question is visible.

**Out of scope:** Paid models or paid tiers.

#### PP-003 — Closing-line value in My bets

- **Status:** done
- **Priority:** P1
- **Size:** M · **Area:** betting
- **Goal:** Each tracked bet shows the closing price and whether it beat it, with a running total.

**Why it matters:** Beating the closing line is the best sign a bet was smart, even when it loses. It turns My
bets into a real bet journal.

**Done when:**
- Each tracked bet shows the closing price and whether it beat it, with a running total at the top.

**References:** b36788b (2026-10-29), `frontend/src/pages/MyBetsPage.jsx`

#### PP-004 — Smart alerts

- **Status:** planned
- **Priority:** P1
- **Size:** M · **Area:** growth
- **Goal:** Ship at least one new alert type that matters, such as "your team's playoff odds jumped 15%" or
  "tonight's starter just changed".

**Why it matters:** Goal alerts are what bring people back. A few alerts that matter could do more for
retention than any new page.

**Requirements:**
- Lives behind the existing alert settings, and is opt-in.

**Done when:**
- At least one new alert type ships behind the existing alert settings, opt-in.
- It doesn't add noise.

### Planned

#### PP-005 — LangGraph experiment

- **Status:** planned
- **Priority:** P2
- **Size:** M · **Area:** ai
- **Goal:** Rebuild the assistant's tool loop in LangGraph on a side branch and compare it with the
  hand-written loop.

**Why it matters:** An honest interview answer: "I've built agents with and without a framework, and here's
when I'd pick each."

**Done when:**
- Both versions answer the same eval cases.
- A learning-log entry compares them.

**Out of scope:** Changing production. This is learning only.

#### PP-006 — Post agent: stop always picking "Swing"

- **Status:** planned
- **Priority:** P2
- **Size:** S · **Area:** ai
- **Goal:** The post drafting agent picks a wider variety of stories instead of almost always the swing of the
  night.

**Why it matters:** More varied drafts are more interesting to post.

**Requirements:**
- An eval for variety, plus a nudge in the agent's instructions.

**Done when:**
- An eval measures how varied the picks are.
- Over two weeks the picks aren't all the same kind of story.

#### PP-007 — Revisit the 30% model / 70% market split

- **Status:** blocked
- **Priority:** P2
- **Size:** S · **Area:** model
- **Goal:** Make the fair-odds split follow the evidence once there are enough graded games.

**Why it matters:** The fair odds lean on the market because the model hasn't beaten it yet. The split should
follow the evidence, either way.

**Done when:**
- The report card numbers are checked, and the split is kept or changed with the reason written down.

**Depends on:** 500+ graded games on the report card (246 on 2026-11-17 at about 47 a week, so around late
December).

#### PP-008 — Sort standings on phones

- **Status:** planned
- **Priority:** P2
- **Size:** S · **Area:** fan
- **Goal:** Phones can sort the standings with a small "Sort by" menu.

**Why it matters:** Desktop can sort by any column, but phones show cards with no headers, so sorting doesn't
work there.

**Done when:**
- Phones can sort standings by the same stats as desktop.

**References:** 4fb0b55 (desktop sorting)

#### PP-009 — Trade simulator v2

- **Status:** planned
- **Priority:** P2
- **Size:** M · **Area:** model
- **Goal:** The "what if" simulator handles goalies and a player missing part of the season.

**Why it matters:** Both come up all the time in real trade and injury talk.

**Done when:**
- You can trade a goalie and set a player out for N games.
- The playoff odds respond sensibly.

#### PP-010 — Playoff series odds

- **Status:** blocked
- **Priority:** P3
- **Size:** L · **Area:** model
- **Goal:** Each playoff series shows win chances by game count, with a bracket that updates after every game.

**Why it matters:** Once the playoffs start, the regular-season pages matter less. This keeps PuckPulse useful
into June.

**Done when:**
- Each series shows win chances by game count.
- The bracket updates after every game.

**Depends on:** The calendar: start in March 2027, before the playoffs.

## Future ideas

- xG rink bias correction: some arenas record shots differently, which skews xG.
- Win chances on the scoreboard cards, kept subtle so the scoreboard stays clean.
- "Why did the odds change?": say whether it was a goalie change, an injury, a back-to-back or the market.
- Pre-rendered pages for search engines, so Google sees real HTML instead of a blank shell.
- Player impact from NHL EDGE tracking data (skating speed, zone time). A big research project.
- Parked: player props. The free Odds API tier can't cover the calls.
- Parked: better totals. Starting goalies and team goaltending tested null; waits for a genuinely new idea.
- Parked: social posts (X/Bluesky) in the news feed. No good free source.
- Parked: making money (ads, PuckPulse+). Not until traffic is steady and people clearly use the AI features.
- Parked: a second sport. If it ever happens, MLB fills the NHL off-season.

## Dated checks

Not roadmap work; reminders kept here so they aren't lost.

| When | Check |
|---|---|
| 2026-11-18 | Umami: compare `ai-panel-open` with `ai-question` (do people who open the AI actually ask something?) |
| ~2026-11-30 | Google Search Console: did the "Duplicate without user-selected canonical" fix pass validation? |
| Early each month | Neon: compute hours used vs. the free 100 (it hit 80% in October) |
| Anytime | Delete the old, unused images under `ghcr.io/nmagera07/` (optional cleanup) |
