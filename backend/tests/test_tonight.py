"""tonight: the facts behind each of tonight's games (PP-011)."""

from datetime import date, datetime, timezone

import tonight

DAY = date(2026, 11, 25)


def game(day, opponent, is_home, xgf=3.0, xga=2.0, gf=3, ga=2):
    return {"game_date": date.fromisoformat(day), "opponent": opponent, "is_home": is_home,
            "xg_for": xgf, "xg_against": xga, "goals_for": gf, "goals_against": ga}


def test_miles_between_rinks():
    assert tonight.miles_between("NYR", "NYR") == 0
    assert 245 < tonight.miles_between("PIT", "PHI") < 270
    assert tonight.miles_between("PIT", "XXX") is None
    assert len(tonight.ARENAS) == 32


def test_odds_move_from_the_morning_to_the_close():
    at = datetime(2026, 11, 25, 7, tzinfo=timezone.utc)
    morning = {"home_prob": 0.55, "home_line": -130, "away_line": 110, "books": 8, "captured_at": at}
    close = {"home_prob": 0.585, "home_line": -150, "away_line": 125, "books": 9, "captured_at": at}
    move = tonight.odds_move(morning, close)
    assert move["open"]["home_line"] == -130 and move["latest"]["home_line"] == -150
    assert move["home_pts"] == 3.5 and move["open"]["as_of"].startswith("2026-11-25T07:00")


def test_odds_move_before_a_second_snapshot_or_without_any():
    move = tonight.odds_move({"home_prob": 0.5, "home_line": 100, "away_line": -120}, None)
    assert move["latest"] is None and move["home_pts"] is None
    assert tonight.odds_move(None, None) is None


def test_recent_form_beyond_the_record():
    rows = [game("2026-11-23", "BOS", True, xgf=2.0, xga=3.0, gf=4, ga=1)] * 4 + [game("2026-11-01", "BOS", True)] * 10
    form = tonight.recent_form(rows)
    assert form["games"] == 10
    assert form["goals_for"] == 4 * 4 + 6 * 3 and form["goals_against"] == 4 * 1 + 6 * 2
    assert form["xg_pct"] == round(26 / (26 + 24), 3)
    assert form["scoring_vs_xg"] == 34 - 26 and form["allowing_vs_xg"] == 16 - 24
    assert tonight.recent_form([]) is None


def test_travel_after_a_road_back_to_back():
    rows = [game("2026-11-24", "BOS", False), game("2026-11-22", "MTL", False), game("2026-11-20", "TOR", True)]
    trip = tonight.travel("PIT", rows, DAY, tonight_home="NYR")
    assert trip["rest_days"] == 0 and trip["last_opponent"] == "BOS" and not trip["last_home"]
    assert 180 < trip["miles"] < 200  # Boston to New York
    assert trip["road_trip_game"] == 3


def test_travel_at_home_after_a_home_game():
    trip = tonight.travel("PIT", [game("2026-11-22", "MTL", True)], DAY, tonight_home="PIT")
    assert trip["rest_days"] == 2 and trip["miles"] == 0 and trip["road_trip_game"] == 0
    assert tonight.travel("PIT", [], DAY, "PIT") is None


class TestTonightRoute:
    def test_adds_moves_form_travel_injuries_and_the_brief_to_the_board(self, client, db_router, monkeypatch):
        import api
        monkeypatch.setattr(api.projected_lineups, "lineup", lambda away, home, day: None)
        monkeypatch.setattr(api.news, "_updates", {})
        monkeypatch.setattr(api.news, "injuries", lambda team=None: {"source": "ESPN", "teams": {
            "PIT": [{"player": "Kris Letang", "status": "Out", "injury": "Lower body"}]}})
        at = datetime(2026, 11, 25, 7, tzinfo=timezone.utc)
        db_router.when("from teams", [{"team_abbrev": "COL", "team_name": "Colorado Avalanche"},
                                      {"team_abbrev": "PIT", "team_name": "Pittsburgh Penguins"}])
        db_router.when("from game_predictions", [{"game_id": 7, "home_abbrev": "COL", "away_abbrev": "PIT",
                                                  "home_win_prob": 0.6, "home_goals": 3.2, "away_goals": 2.6}])
        db_router.when("select distinct on (game_id)", [])  # the Bets board's latest snapshot
        db_router.when("from market_odds", [
            {"game_id": 7, "captured": "morning", "home_prob": 0.58, "home_line": -140, "away_line": 120, "books": 8, "captured_at": at},
            {"game_id": 7, "captured": "close", "home_prob": 0.61, "home_line": -160, "away_line": 135, "books": 9, "captured_at": at}])
        db_router.when("from goalie_projections", [])
        db_router.when("from season_sim_inputs", [{"games": [["2026-11-25", "COL", "PIT", False, True]]}])
        db_router.when("from players", [])
        db_router.when("from team_game_xg", [
            {"team_abbrev": "PIT", **game("2026-11-24", "UTA", False)},
            {"team_abbrev": "COL", **game("2026-11-22", "DAL", True, xgf=2.0, xga=2.0)}])
        db_router.when("from game_briefs", [{"game_id": 7, "text": "- COL is 6-1 at home."}])
        body = client.get("/tonight?date=2026-11-25").json()
        g = body["games"]["7"]
        assert g["b2b"] == {"home": False, "away": True} and "moneyline" in g
        assert g["odds_move"]["home_pts"] == 3.0 and g["odds_move"]["latest"]["home_line"] == -160
        assert g["form"]["home"]["xg_pct"] == 0.5 and g["form"]["away"]["games"] == 1
        assert g["travel"]["away"]["rest_days"] == 0 and g["travel"]["away"]["road_trip_game"] == 2
        assert 350 < g["travel"]["away"]["miles"] < 400  # Salt Lake City to Denver
        assert g["travel"]["home"]["miles"] == 0 and g["travel"]["home"]["rest_days"] == 2
        assert g["injuries"]["away"][0]["player"] == "Kris Letang" and g["injuries"]["home"] == []
        assert g["brief"] == "- COL is 6-1 at home."
        # Recent form and travel only look at games before tonight.
        _, params = next(c for c in db_router.calls if "from team_game_xg" in c[0].lower())
        assert params[0] == ["COL", "PIT"] and params[1] == DAY

    def test_no_games(self, client, db_router):
        db_router.when("from game_predictions", [])
        db_router.when("from market_odds", [])
        db_router.when("from goalie_projections", [])
        db_router.when("from season_sim_inputs", [])
        db_router.when("from players", [])
        assert client.get("/tonight?date=2026-07-01").json() == {"date": "2026-07-01", "games": {}}
