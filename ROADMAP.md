# PuckPulse roadmap

What I want to build next, roughly in order. Atelier HQ reads this file to suggest what to work
on each day, so every item uses the same fields.

**Last reviewed:** 2026-11-17

**Where PuckPulse is headed:** the place NHL bettors check before they bet. Fair odds next to
the best price, everything that moves a line, and an honest track record against the closing
line. The fan side (scores, standings, alerts, pick'em) stays the base, and the site stays
uncluttered. Right now the goal is growing the user base, not making money. PuckPulse is also
my main portfolio piece for applied-AI engineering jobs, so AI work that teaches me something
counts double.

**Rules for every item:** free tiers only (no paid AI APIs), no "locks" in any betting copy,
keep 21+ and 1-800-GAMBLER, and release only when no games are live.

## How to read an item

- **Status:** `next` (do soon) · `planned` (after that) · `idea` (worth doing, not scheduled) ·
  `parked` (not now, reason given) · `waiting` (needs a date or someone else)
- **Size:** `S` (one sitting) · `M` (a few sessions) · `L` (a week or more)
- **Area:** `ai` · `betting` · `model` · `fan` · `growth` · `infra`
- **Why:** what it gets me
- **Done when:** how I'll know it's finished

---

## Next

### Pydantic models for the AI's tool inputs
- **Status:** next · **Size:** S · **Area:** ai
- **Why:** right now a bad tool call from the model can fail in confusing ways. With a strict
  input schema for each tool, bad calls get rejected with an error the model can read and fix
  on its own. This is one of the top things applied-AI job postings ask for.
- **Done when:** every tool in `intelligence/app/tools.py` validates its input with a Pydantic
  model, a bad call returns a clear error to the model, and the evals still pass.

### A token budget and a cost for every question
- **Status:** next · **Size:** M · **Area:** ai
- **Why:** I want to be able to say what one question costs in tokens and time, and to cap
  runaway questions. "Reliability, latency and cost" comes up in every AI engineering interview.
- **Done when:** each answer records its tokens and time in Langfuse, a question that goes over
  budget stops cleanly, and I can see the average cost per question.

### Closing-line value in My bets
- **Status:** next · **Size:** M · **Area:** betting
- **Why:** the best sign a bet was smart is beating the closing line, even when it loses. My bets
  already grades wins and losses; adding "did you beat the close?" makes it a real bet journal.
- **Done when:** each tracked bet shows the closing price and whether it beat it, with a running
  total at the top.

### Smart alerts
- **Status:** next · **Size:** M · **Area:** growth
- **Why:** goal alerts are what bring people back. A few alerts that matter ("your team's
  playoff odds jumped 15%", "tonight's starter just changed") could do more for retention than
  any new page.
- **Done when:** at least one new alert type ships behind the existing alert settings, opt-in,
  and doesn't add noise.

## Planned

### LangGraph experiment
- **Status:** planned · **Size:** M · **Area:** ai
- **Why:** rebuild the assistant's tool loop in LangGraph on a side branch and compare it with
  my hand-written loop. Learning only, so production stays as it is. The goal is an honest
  interview answer: "I've built agents with and without a framework, and here's when I'd pick
  each."
- **Done when:** both versions answer the same eval cases, and a learning-log entry compares
  them.

### Post agent: stop always picking "Swing"
- **Status:** planned · **Size:** S · **Area:** ai
- **Why:** the post drafting agent almost always picks the swing-of-the-night story. An eval for
  variety, plus a nudge in its instructions, should make the drafts more interesting.
- **Done when:** an eval measures how varied the picks are, and over two weeks the picks aren't
  all the same kind of story.

### Revisit the 30% model / 70% market split
- **Status:** waiting (until the report card has 500+ graded games: 246 on 2026-11-17 at about
  47 a week, so around late December) ·
  **Size:** S · **Area:** model
- **Why:** the fair odds lean on the market because the model hasn't beaten it yet. Once there
  are enough games to know, the split should follow the evidence, either way.
- **Done when:** the report card numbers are checked and the split is kept or changed, with the
  reason written down.

### Sort standings on phones
- **Status:** planned · **Size:** S · **Area:** fan
- **Why:** on desktop you can sort standings by any column. Phones show cards with no headers, so
  sorting doesn't work there. A small "Sort by" menu would fix that.
- **Done when:** phones can sort standings by the same stats as desktop.

### Trade simulator v2
- **Status:** planned · **Size:** M · **Area:** model
- **Why:** the "what if" simulator handles skaters, but not goalies or a player missing part of
  the season ("out a month"). Both come up all the time in real trade and injury talk.
- **Done when:** you can trade a goalie and set a player out for N games, and the playoff odds
  respond sensibly.

### Playoff series odds
- **Status:** waiting (start in March, before the playoffs) · **Size:** L · **Area:** model
- **Why:** once the playoffs start, the regular-season pages matter less. Series odds and a
  bracket would keep PuckPulse useful into June.
- **Done when:** each series shows win chances by game count, and the bracket updates after
  every game.

## Ideas

### xG rink bias correction
- **Status:** idea · **Size:** M · **Area:** model
- **Why:** some arenas' scorekeepers record shots a bit differently, which skews xG. Correcting
  for it is the standard next step for an xG model.

### Win chances on the scoreboard cards
- **Status:** idea · **Size:** S · **Area:** fan
- **Why:** a small number on each card would save a tap. It has to stay subtle, so the
  scoreboard stays clean.

### "Why did the odds change?"
- **Status:** idea · **Size:** M · **Area:** betting
- **Why:** when a team's odds move, say why: a goalie change, an injury, a back-to-back, or the
  market moving.

### Pre-rendered pages for search engines
- **Status:** idea · **Size:** L · **Area:** growth
- **Why:** every page starts as the same blank shell until JavaScript runs. Real HTML for each
  page would help Google, and maybe search traffic.

### Player impact from NHL EDGE tracking data
- **Status:** idea · **Size:** L · **Area:** model
- **Why:** skating speed and zone time could add something that box-score stats miss. It's a big
  research project.

## Parked

- **Player props:** a natural fit for betting research, but the free Odds API tier can't cover
  the calls.
- **Better totals:** totals are still about a league-average guess. The obvious ideas (starting
  goalies, team goaltending) tested null, so this waits for a genuinely new idea.
- **Social posts in the news feed (X/Bluesky):** no good free source.
- **Making money (ads, PuckPulse+):** not until traffic is steady and people clearly use the AI
  features.
- **A second sport:** if it ever happens, MLB fills the NHL off-season.

## Dated checks

| When | Check |
|---|---|
| 2026-11-18 | Umami: compare `ai-panel-open` with `ai-question` (do people who open the AI actually ask something?) |
| ~2026-11-30 | Google Search Console: did the "Duplicate without user-selected canonical" fix pass validation? |
| Early each month | Neon: compute hours used vs. the free 100 (it hit 80% in October) |
| Anytime | Delete the old, unused images under `ghcr.io/nmagera07/` (optional cleanup) |

## Done recently

- **2026-11-17:** moved the repo to `atelier-ai-labs/puckpulse`, and rewrote the README.
- **2026-11-15:** canonical URLs for Google.
- **2026-11-13:** retry a failed nightly step right away.
- **2026-11-12:** totals scaled to this season's scoring; each season's team on player pages.
- **2026-11-08 and earlier:** Langfuse tracing, an LLM judge in the evals, streaming AI answers,
  pregame briefs, the data-check investigator, post drafts, My bets, Value of the night.
