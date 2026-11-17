# PuckPulse

**NHL scores, playoff odds, and tonight's lines next to what they should be. Free.**

**Live:** https://puckpulse.io (you can also install it on your phone like an app)

I wanted one place to check last night's scores, see where my team stands in the playoff race,
and look at tonight's betting lines with a straight answer on whether a price is any good.
Nothing I found did all three without paywalls or a wall of ads, so I built it.

PuckPulse is two apps in one:

- **For fans:** live scores and box scores, standings, playoff odds, goal alerts on your phone,
  and pages for every team and player.
- **For betting research:** each game's moneyline, puck line, and total from the sportsbooks,
  next to PuckPulse's own fair odds, plus projected goalies and lineups. Every prediction is
  saved before the games start and graded afterward, so you can see whether the model is
  actually any good.

The numbers come from models I built and backtested on past seasons before shipping them.
There's also an AI analyst you can ask questions on any page.

*It used to be called "NHL Dashboard," and the Azure resources still use that name. Data comes
from the NHL and The Odds API. Not affiliated with or endorsed by the NHL. The betting info is
for entertainment and research, not advice. 21+. Gambling problem? Call 1-800-GAMBLER.*

## What's on the site

**Games**
- **Scores:** today's games with the live period and clock, any day of the season from a
  calendar, and NHL.com recaps and highlights.
- **Box scores:** linescore, scoring summary, three stars, and team and player stats.
- **Game previews:** win chances, the books' odds, each goalie's recent workload, and tonight's
  projected lineups from NHL.com (lines, D pairs, the starter, scratches, injuries). Before
  NHL.com posts them, it shows each team's lineup from its last game.
- **Pregame briefs:** three short AI-written bullets on what matters tonight. Every number in a
  brief has to come from real data, or it doesn't get published.
- **Share links:** `puckpulse.io/g/{id}` turns into a preview card in iMessage, Discord, or
  Reddit, with the matchup and win chances, or the score once the game starts.

**Bets**
- **Tonight's slate:** one card per game with the moneyline (the best price at a
  state-licensed US book, and which book), the puck line, and the total.
- **Fair odds:** right now PuckPulse's fair price is 30% my model and 70% the market. The model
  gets more say once it proves itself against the closing line.
- **Value badge:** shows up when a price pays at least 2% more than it should at fair odds,
  and the model agrees.
- **Context:** back-to-back flags, who's in net (NHL.com's projected starters once they're up,
  otherwise my projection), and a plain-English "how to read this."
- **My bets:** tap any price to track it. It's saved in your browser, no account needed, and
  graded when the game ends.
- **Totals are marked beta** and never get a value badge, because in testing they were only
  about as good as guessing the league average.

**Season**
- **Standings:** by division, with playoff odds and an Advanced view (xG%, shots, PDO).
- **Playoff race:** odds over the season, the points line to get in, why each team's odds are
  what they are, and a simulator for "what if they win their next five?"
- **Team pages:** season summary, roster, lines, injuries, and news.
- **Player pages:** bio, career stats with the team(s) for every season, 5-on-5 stats, and WAR.
- **Compare players:** two players side by side.
- **Time machine:** take a player's season and replay it at another era's scoring level.
- **Draft lottery:** each team's lottery odds, how the lottery works, and a mock draft.
- **News:** headlines from NHL.com, ESPN, and Sportsnet, plus injuries and transactions.

**Keeping score on the model**
- **Track record:** does a 70% pick actually win about 70% of the time? Plus recent picks.
- **Report card:** the model vs. the sportsbooks, graded every day.

**Play along**
- **Beat PuckPulse:** a pick'em with no sign-up. Pick tonight's winners, climb the
  leaderboard, and see if you can beat the model.
- **Goal alerts:** a phone notification for every goal and final in your team's games, within
  about a minute.

**PuckPulse AI**
- **Ask it anything** on any page. It's a tool-using agent (`intelligence/`) that answers only
  from the site's own data and models: standings, schedules, "what if" simulations, and why the
  odds are what they are.
- **It runs on free models:** Gemini, with Groq as a backup.
- **It also does behind-the-scenes jobs:** the pregame briefs; explaining what went wrong when
  the morning data check fails; and drafting social posts that I review before anything goes
  out.
- **It gets checked:** an eval suite tests its answers, and every run is traced in Langfuse so
  I can see exactly what it looked up.

## The models

Everything is graded on games the model didn't train on. The full write-ups (what worked, what
didn't, and why) are in [`docs/LEARNING.md`](docs/LEARNING.md).

| Model | What it does | How good is it? |
|---|---|---|
| **xG** (`xg_model.py`, `train_xg.py`) | The chance a shot becomes a goal. Logistic regression on 41 features (distance, angle, shot type, rebounds, rushes, strength…), trained on 453k shots from 2022–26 | Ties MoneyPuck's shot-level xG on 2024-25. As team ratings: Brier 0.1093 vs. MoneyPuck's 0.1104 |
| **Team ratings + playoff odds** (`simulate_playoff_odds.py`, v2.6) | Ratings from goals and xG, pulled toward a preseason guess made from the roster (adding up the players) plus goaltending. Then 10,000 simulated seasons with the real tiebreakers. Home ice and back-to-backs are fit on real games | Playoff Brier 0.1095 across 4 backtested seasons (down from 0.1167 in v2.1) |
| **Goal model** (`goal_model.py`) | The chance of every possible final score, which gives the moneyline, puck line, and total from one place. Includes score effects, empty-net goals, OT, and how much the league is scoring this season | Puck line within 1–3 points of reality across 3 held-out seasons (5,248 games). Totals are still about a league-average guess |
| **WAR** (`war.py`, `war_v2.py`) | Each player's wins above a replacement-level player this season. Skaters from RAPM plus finishing, special teams, and penalties; goalies from goals saved | Updated every night for 850+ players |
| **Projected goalies** (`goalie_starts.py`) | Each goalie's chance to start tonight, from recent starts, back-to-back rotation, and the current roster | The top pick started 65.6% of the time (78% on back-to-backs) over 10,112 team-games |

I also tested some ideas that **didn't** make it, because the data said no:
- aging curves (survivor bias)
- mixing this season's goalie starts into the preseason guess
- the starting goalie as an input to the win model or the totals (both added nothing once
  back-to-backs and team goaltending were already in)

**The report card:** every morning the day's predictions are saved before any game starts, and
they never change after that. `market_odds.py --report` grades them against the sportsbooks'
morning and closing lines and against Kalshi. So far the books are slightly ahead on
moneylines, which is why the Bets tab leans on the market. It takes a few hundred games to know
for sure.

## How it's built

```
                      ┌────────────────────────── Azure ───────────────────────────┐
 Browser / PWA  ────► │ Static Web Apps (React + Vite)                             │
                      │   └─ managed function: share pages (link previews)         │
                      │                                                            │
                      │ Container App: API (FastAPI, 0.25 CPU, 1 replica always)   │──► Postgres (Neon)
                      │ Container App: PuckPulse AI (intelligence/, scales to 0)   │      ▲
                      │ Container Apps Job: daily ingest, 06:00 UTC ───────────────┼──────┤
                      │ Function (Flex Consumption): live notifier + closing odds ─┼──────┘
                      └────────────────────────────────────────────────────────────┘
   Sources: NHL API (scores, play-by-play, shift charts, rosters) · NHL.com content API (lineups,
   news) · NHL stats API · The Odds API · Kalshi · ESPN/Sportsnet/RotoWire/DobberHockey news
```

- **Frontend:** React 19 + Vite on Azure Static Web Apps.
  - A small server function builds the share-link previews, because link previewers don't run
    JavaScript.
  - Strict Content Security Policy (`script-src 'self'`). The theme is set before the page
    paints (`public/theme-init.js`), so there's no flash.
  - Each page tells search engines its one real URL (a canonical tag), and there's a sitemap.
- **API:** FastAPI in a container on Azure Container Apps, with read-only database access and a
  short cache.
  - Live scores and box scores come straight from the NHL, with a fallback cache if the NHL is
    slow.
  - Everything else comes from Postgres.
  - It also draws the share-card images (Pillow).
- **PuckPulse AI:** its own FastAPI service. It only reads the API's public endpoints and never
  gets database credentials.
- **Daily job:** see the next section.
- **Notifier** (`backend/notifier_function/`, Azure Functions): sends goal and final alerts every
  minute during games, and saves the closing odds about 15 minutes before puck drop.
- **Database:** Postgres on Neon.
- **Cost:** about $15 a month on Azure, mostly the API's always-on replica. Free tiers cover the rest.

## The nightly data job

Every night at 06:00 UTC (1 AM ET in winter, 2 AM in summer), `backend/run_daily_ingest.py` runs these in order:

| Step | What it does |
|---|---|
| `ingest_standings.py` | Today's standings for all 32 teams |
| `ingest_xg.py` | PuckPulse xG for every finished game from the play-by-play, plus each team's starting goalie |
| `ingest_advanced_stats.py` | 5-on-5 Corsi, Fenwick, xG and PDO for teams and skaters, and goalie GSAx |
| `war.py` | WAR for every player |
| `simulate_playoff_odds.py` | Team ratings and playoff odds |
| `game_predictions.py` | Saves today's win chances and expected goals, and grades last night's |
| `goalie_starts.py` | Projected starting goalies for today |
| `market_odds.py` | Morning odds snapshot: sportsbook consensus, best licensed prices, and Kalshi |
| `daily_digest.py` | The morning digest, written by PuckPulse AI from that day's facts |
| `ingest_player_stats.py` | Rosters, season stats, and each player's teams by season; marks released players |
| `team_lines.py` | Each team's lines and D pairs from its last game |
| `moneypuck_odds.py` | MoneyPuck's playoff odds, saved next to mine for a head-to-head |

Each step runs on its own, so one failure doesn't take down the rest. If a step fails, it waits
45 seconds and tries again right away, before anything that depends on it runs. If it still
fails, it gets one more try at the end. A couple of hours later (08:30 UTC) a data check runs 16 sanity checks on the
results. If anything looks off, the AI looks into why and I get a push notification.

Also running:
- **Every minute during games:** `notify_live_games.py` (goal and final alerts; records results
  for pick'em).
- **Every 5 minutes:** saves closing lines (only a few Odds API calls a day).
- **On demand, cached:** NHL.com projected lineups (`projected_lineups.py`).
- **Run by hand:** the backtests (`backtest_playoff_odds.py`, `calibrate_playoff_model.py`,
  `backtest_goal_model.py`, `backtest_goalie_starts.py`) and xG training (`train_xg.py`).

## How I work on it

- **Branches:** feature branch → PR into `dev` → release PR from `dev` to `main`. Merging to
  `main` deploys, and I only release when no games are live.
- **Tests run before every deploy:** about 700 backend tests (pytest), 400 frontend tests
  (Vitest, plus ESLint), and 180 for the AI service.
- **Deploys check themselves:** GitHub Actions logs into Azure with OIDC, so there's no stored
  Azure password. After a backend deploy, the new version has to be healthy *and* `/health`
  has to report the exact commit, or the deploy fails. A daily check also fails if production
  isn't running what's on `main`.
- **Monitoring:** Sentry for errors and real-user performance, an Azure alert if the API
  crashes, a heartbeat on the nightly job, Application Insights on the notifier, and Langfuse
  traces for the AI.
- **Analytics:** Umami Cloud. No cookies, and the tracker is self-hosted so the security policy
  stays strict.

## Where the data comes from

- **NHL:** `api-web.nhle.com` (scores, play-by-play, rosters, stats, schedules),
  `api.nhle.com/stats/rest` (shift charts, season stats, team list), and NHL.com's content API
  (projected lineups, news). No key needed. Huge thanks to
  https://github.com/Zmalski/NHL-API-Reference for documenting it.
- **MoneyPuck.com:** its published playoff odds, saved next to mine as a benchmark (not shown on
  the site). Since October 2026, every number on the site is either mine or the NHL's.
- **The Odds API:** sportsbook odds (free tier, about 310 of 500 credits a month). Best prices
  only come from state-licensed US books.
- **Kalshi:** public market prices, saved and graded but not shown.
- **ESPN and Sportsnet:** headlines, injuries, and transactions.

## What's where

```
backend/        FastAPI app, nightly job, models, backtests, tests
  notifier_function/   Azure Function: goal alerts + closing odds
frontend/       React app (src/), the share-link function (api/), PWA config
intelligence/   PuckPulse AI: the agent, its tools, the briefs/investigator/post agents, evals
docs/           LEARNING.md: what I built, measured, and learned along the way
```

## Running it locally

See [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md), and
[`intelligence/README.md`](intelligence/README.md).
