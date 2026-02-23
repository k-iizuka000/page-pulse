const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
  "source",
  "fbclid",
  "gclid",
]);

/**
 * Normalizes a URL by:
 * 1. Removing the hash fragment.
 * 2. Stripping known tracking query parameters.
 * 3. Removing a trailing slash from the pathname (except the root "/").
 *
 * @throws {Error} When `url` is not a valid absolute URL.
 */
export function normalizeUrl(url: string): string {
  // new URL() throws a TypeError for invalid URLs.
  const parsed = new URL(url);

  // 1. Remove hash.
  parsed.hash = "";

  // 2. Strip tracking params.
  const keysToDelete: string[] = [];
  parsed.searchParams.forEach((_value, key) => {
    if (TRACKING_PARAMS.has(key)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => parsed.searchParams.delete(key));

  // 3. Remove trailing slash from pathname, keeping root "/" intact.
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}
