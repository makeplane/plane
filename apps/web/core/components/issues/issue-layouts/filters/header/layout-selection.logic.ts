/**
 * Extracts the layout value from a URL query string.
 * Returns null if no valid layout is present.
 */
export function getLayoutFromUrl(search: string, validLayouts: string[]): string | null {
  try {
    const params = new URLSearchParams(search);
    const layout = params.get("layout");

    if (!layout) return null;
    if (!validLayouts.includes(layout)) return null;

    return layout;
  } catch {
    return null;
  }
}

/**
 * Returns a new query string with the layout updated.
 * Does not touch window or history — pure logic only.
 */
export function setLayoutInQuery(search: string, layout: string): string {
  try {
    const params = new URLSearchParams(search);
    params.set("layout", layout);
    return params.toString();
  } catch {
    return search;
  }
}
