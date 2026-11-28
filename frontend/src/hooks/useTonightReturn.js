import { useEffect } from "react";
import { API_BASE } from "../config.js";
import { todayISO } from "../utils/dates.js";
import { recordReturnCheck, returnToCheck } from "../utils/tonightTest.js";

// PP-011: when a browser in the audience test opens PuckPulse on a later day
// (any page), check whether today is a game day and, if so, count its return.
// Does nothing for everyone else, and at most one fetch a day.
export function useTonightReturn() {
  useEffect(() => {
    const today = todayISO();
    if (!returnToCheck(today)) return undefined;
    let active = true;
    fetch(`${API_BASE}/games/date/${today}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("schedule unavailable"))))
      .then((data) => active && recordReturnCheck(today, Array.isArray(data?.games) && data.games.length > 0))
      .catch(() => {}); // try again on the next visit
    return () => { active = false; };
  }, []);
}
