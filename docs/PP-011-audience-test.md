# PP-011: who is PuckPulse for? The two-audience test

Written before anything is posted. Nothing in this file should change once the first post goes up, except the
**Result** section at the bottom.

## What's being tested

One page, `/tonight`: each of tonight's games with the likely or confirmed goalies, injuries, rest and travel,
recent form beyond the record (expected-goal share, and goals vs expected), and how the odds moved since
morning. The same data and the same layout in two framings. Only the title and the intro line change
(`frontend/src/utils/tonight.js`):

| Group | Framing | Tagged link |
|---|---|---|
| `bet` | "Before you bet" | `https://puckpulse.io/tonight?for=bet&utm_source=<community>&utm_medium=post&utm_campaign=pp011-bet` |
| `lineup` | "Before you set your lineup" | `https://puckpulse.io/tonight?for=lineup&utm_source=<community>&utm_medium=post&utm_campaign=pp011-lineup` |

`<community>` is the place the post goes (for example `reddit-r-x`), so each post's traffic can be checked in
Umami's UTM report. The group itself comes from `for=`, not from the UTM tags.

A browser joins the group of the first tagged link it opens, keeps that framing on every later visit, and
can't be in both groups (saved in that browser's local storage only; nothing personal). Visitors without a
tagged link see neutral wording ("Tonight") and aren't counted. Both framings keep the research-only wording
(no picks, no "locks"), and both show the 21+ and 1-800-GAMBLER note, because both show odds.

## What's measured (Umami events)

Each event is sent at most once per browser, so an event count is a visitor count.

- `tonight-arrive` `{framing}`: a browser joined a group. This is **n**.
- `tonight-return` `{framing, days, joined}`: a browser in a group opened PuckPulse (any page) on a **later game day**
  (a day with at least one NHL game), within 14 days of joining. This is **x**.
- `tonight-game-open` `{framing, game, from}`: a game's section opened, from the scoreboard, a link, or a tap on
  the page. Counted for context only; it doesn't decide the result.

To read it: Umami, Events, filter each event by its `framing` property. Count `tonight-arrive` over the two
posting weeks only, and `tonight-return` from the first post until **14 days after the last post**,
keeping only returns whose `joined` date falls in the posting weeks (so n and x are the same visitors).
Every visitor gets the same 14 days to come back, so the result can't be read before then. A visitor who
arrives on day 13 has until day 27, and reading the result at day 14 would miss most of those returns.

## The rule (decided now)

- **Return rate** for a group is x of n: the visitors it sent who came back on another game day within 14
  days of their first visit. Compare return rates, never raw traffic.
- **A framing wins if both:**
  1. its return rate is **at least 20%**, and
  2. it beats the other group's rate by a **clear margin**: at least **10 percentage points** higher. *(The
     roadmap item says "a clear margin" without a number; 10 points is this PR's proposal and must be
     confirmed or changed here before the first post.)*
- If neither framing meets both conditions, **neither won**. That's a result too: write it up as such.
- A group with fewer than 30 visitors (n < 30) can't win: too few to tell. Report it anyway. *(Also this PR's
  proposal, to confirm or drop before the first post.)*

## How it's posted (the fair part)

- Both links go out on the **same days**, for **two weeks** from the first post.
- In **communities of a similar size** (for example, a betting subreddit and a fantasy hockey subreddit with
  member counts within about 2x of each other), with the **same kind of post** (same format, same length,
  same time of day; a text post linking the page, not an image or a comment reply).
- No paid ads or promotion. No changes to the page's wording during the test.
- Write down each post (date, community, its size, link used) in the log below as it goes up.

### Post log

| Date | Group | Community | Members | Link |
|---|---|---|---|---|
| | | | | |

## Result

*(Filled in 14 days after the last post, once every visitor has had their full 14 days. Report each group as
"x of n".)*

- `bet`: x of n returned (rate)
- `lineup`: x of n returned (rate)
- Winner: bettors / fantasy players / neither
- What PuckPulse focuses on next:
