/**
 * Resolve the default workspace view's "today" filters dynamically at fetch time.
 *
 * The default view stores empty filters `{}` in the DB. When fetching issues
 * for the default view we inject today's date using the backend's recognized format:
 *   `"YYYY-MM-DD;after"` → start_date__gte = YYYY-MM-DD
 *   `"YYYY-MM-DD;before"` → target_date__lte = YYYY-MM-DD
 */
export function resolveDefaultViewFilters(): {
  start_date?: string;
  target_date?: string;
} {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  return {
    start_date: `${todayStr};after`,
    target_date: `${todayStr};before`,
  };
}
