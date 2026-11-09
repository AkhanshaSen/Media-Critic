/** Base path for GitHub Pages (e.g. `/MEDIA-CRITIC`). Empty in local dev. */
export function getBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
}

/** Full origin + basePath for OAuth redirects (browser only). */
export function getSiteUrl(): string {
  if (typeof window === "undefined") return "";
  // Keep OAuth + PKCE on one host: Supabase redirects are usually allow-listed for localhost, not 127.0.0.1
  const origin = window.location.origin.replace(
    "://127.0.0.1",
    "://localhost",
  );
  return `${origin}${getBasePath()}`;
}

export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${normalized}`;
}
