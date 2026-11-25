"""
The Tonight page (PP-011): the facts behind each of tonight's games, in one
place, for whatever the reader is deciding (a bet, a fantasy lineup, a
pick'em pick). api.py's /tonight puts them together from data PuckPulse
already has; this module holds the pure parts, so they can be tested alone:

  - odds_move: how the sportsbook consensus moved from the morning snapshot
    to the latest one (the closing snapshot, taken near puck drop),
  - recent_form: each team's last few games beyond the record, from its
    expected goals (team_game_xg): shot share, and goals vs expected,
  - travel: rest days, where the team played last and how far that is from
    tonight's rink, and how long the road trip is.

It's research, not advice: nothing here picks a side.
"""

from math import asin, cos, radians, sin, sqrt

FORM_GAMES = 10

# Each team's home rink, as (latitude, longitude), for travel distances.
# City-level accuracy is all a "how far did they come" line needs.
ARENAS = {
    "ANA": (33.808, -117.877), "BOS": (42.366, -71.062), "BUF": (42.875, -78.876), "CGY": (51.037, -114.052),
    "CAR": (35.803, -78.722), "CHI": (41.881, -87.674), "COL": (39.749, -105.008), "CBJ": (39.969, -83.006),
    "DAL": (32.790, -96.810), "DET": (42.341, -83.055), "EDM": (53.547, -113.498), "FLA": (26.158, -80.326),
    "LAK": (34.043, -118.267), "MIN": (44.945, -93.101), "MTL": (45.496, -73.569), "NSH": (36.159, -86.779),
    "NJD": (40.734, -74.171), "NYI": (40.723, -73.590), "NYR": (40.751, -73.993), "OTT": (45.297, -75.927),
    "PHI": (39.901, -75.172), "PIT": (40.439, -79.989), "SJS": (37.333, -121.901), "SEA": (47.622, -122.354),
    "STL": (38.627, -90.203), "TBL": (27.943, -82.452), "TOR": (43.643, -79.379), "UTA": (40.768, -111.901),
    "VAN": (49.278, -123.109), "VGK": (36.103, -115.178), "WSH": (38.898, -77.021), "WPG": (49.893, -97.144),
}


def miles_between(a, b):
    """Great-circle miles between two teams' rinks, or None if either is unknown."""
    if a not in ARENAS or b not in ARENAS:
        return None
    (lat1, lon1), (lat2, lon2) = (tuple(map(radians, ARENAS[t])) for t in (a, b))
    h = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return round(2 * 3958.8 * asin(sqrt(h)))


def _num(value):
    return float(value) if value is not None else None


def odds_move(morning, latest):
    """
    morning, latest: market_odds sportsbooks rows (dicts) or None. The
    home team's no-margin chance and both moneylines, then and now, and the
    change in the home chance in percentage points. None without a morning
    snapshot; "moved" is None until a later snapshot exists.
    """
    if not morning:
        return None
    def snap(row):
        return {"home_prob": round(_num(row["home_prob"]), 4), "home_line": row.get("home_line"),
                "away_line": row.get("away_line"), "books": row.get("books"),
                "as_of": row["captured_at"].isoformat() if row.get("captured_at") else None}
    then = snap(morning)
    now = snap(latest) if latest and latest is not morning else None
    moved = round((now["home_prob"] - then["home_prob"]) * 100, 1) if now else None
    return {"open": then, "latest": now, "home_pts": moved}


def recent_form(games, n=FORM_GAMES):
    """
    games: the team's team_game_xg rows, newest first. Over the last n: the
    share of expected goals (all situations), goals for and against, and
    goals minus expected goals at each end (finishing and goaltending, the
    part of a record most likely to cool off or heat up). None if no games.
    """
    rows = games[:n]
    if not rows:
        return None
    xgf = sum(float(r["xg_for"]) for r in rows)
    xga = sum(float(r["xg_against"]) for r in rows)
    gf = sum(int(r["goals_for"]) for r in rows)
    ga = sum(int(r["goals_against"]) for r in rows)
    return {
        "games": len(rows),
        "xg_pct": round(xgf / (xgf + xga), 3) if xgf + xga else None,
        "goals_for": gf, "goals_against": ga,
        "xg_for": round(xgf, 1), "xg_against": round(xga, 1),
        "scoring_vs_xg": round(gf - xgf, 1),     # + : scoring more than its chances
        "allowing_vs_xg": round(ga - xga, 1),    # - : its goalies are stopping more than expected
    }


def travel(team, games, day, tonight_home):
    """
    team: the abbrev; games: its team_game_xg rows, newest first, each with
    the opponent's abbrev under "opponent"; day: tonight's date;
    tonight_home: the home team tonight. Rest days, where it played last,
    the miles from there to tonight's rink, and how many road games in a row
    tonight makes (0 at home). None if it hasn't played yet this season.
    """
    if not games:
        return None
    last = games[0]
    last_rink = team if last["is_home"] else last["opponent"]
    road = 0
    if tonight_home != team:
        road = 1
        for g in games:
            if g["is_home"]:
                break
            road += 1
    return {
        "last_game": str(last["game_date"]),
        "last_opponent": last["opponent"],
        "last_home": bool(last["is_home"]),
        "rest_days": (day - last["game_date"]).days - 1,
        "miles": miles_between(last_rink, tonight_home),
        "road_trip_game": road,
    }
