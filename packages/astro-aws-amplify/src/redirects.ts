import type {
  AstroConfig,
  AstroIntegrationLogger,
  IntegrationResolvedRoute,
  ValidRedirectStatus,
} from "astro";

type TrailingSlashMode = AstroConfig["trailingSlash"];

/**
 * A single entry in AWS Amplify's "Rewrites and redirects" rule list.
 *
 * Matches the `CustomRule` shape consumed by `aws amplify update-app
 * --custom-rules` (verified against `@aws-sdk/client-amplify`'s
 * `CustomRule` type).
 *
 * @see https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html
 */
export interface AmplifyCustomRule {
  /** Path pattern to match against the incoming request. */
  source: string;
  /** Destination path or URL. Wildcards from `source` are substituted positionally. */
  target: string;
  /** Status string accepted by Amplify's `customRules` API. */
  status: AmplifyRedirectStatus;
  /** Optional Amplify match condition (country code, etc.). */
  condition?: string;
}

/**
 * Status values accepted by Amplify's `customRules` API.
 *
 * - `"200"` — rewrite (URL stays the same in the browser)
 * - `"301"` — permanent redirect
 * - `"302"` — temporary redirect
 * - `"404"` — not found
 * - `"404-200"` — single-page-app fallback (rewrite missing routes to a 200 page)
 */
export type AmplifyRedirectStatus = "200" | "301" | "302" | "404" | "404-200";

/**
 * Astro supports a wider set of redirect status codes than Amplify exposes
 * through `customRules`. Codes outside this map are skipped with a warning;
 * codes that map to a different number (303/307/308) are emitted but logged
 * so the user knows the precise HTTP semantics will shift.
 */
const ASTRO_TO_AMPLIFY_STATUS: Partial<
  Record<ValidRedirectStatus, AmplifyRedirectStatus>
> = {
  301: "301",
  302: "302",
  303: "302",
  307: "302",
  308: "301",
};

/** Astro statuses that map to Amplify with no semantic loss. */
const EXACT_STATUS_CODES = new Set<ValidRedirectStatus>([301, 302]);

/**
 * Prepend the site's base path to a route, normalizing the slash between them.
 *
 * Astro normalizes `config.base` to always start with `/` but the trailing
 * slash depends on the user's `trailingSlash` setting (`"always"` → `"/docs/"`,
 * otherwise → `"/docs"`). `IntegrationResolvedRoute.pattern` is NOT base-
 * prefixed — it's relative to the configured base — so we prepend it ourselves
 * to keep redirects matching at the Amplify edge.
 *
 * @example
 *   joinBase("/", "/old")        // "/old"
 *   joinBase("/docs", "/old")    // "/docs/old"
 *   joinBase("/docs/", "/old")   // "/docs/old"
 *   joinBase("/docs", "")        // "/docs/"   (empty path resolves to base root)
 */
export function joinBase(base: string, path: string): string {
  if (!base || base === "/") return path;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const rootedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${rootedPath}`;
}

/**
 * Whether a redirect destination points at a different origin and so must
 * not be base-prefixed.
 *
 * Matches any URI with a scheme (`https://`, `mailto:`, `tel:`, …) and
 * protocol-relative URLs (`//cdn.example.com`). Anything else is treated as
 * a same-origin path.
 */
function isAbsoluteUrl(value: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

/**
 * Bring a generated path into line with the user's `trailingSlash` setting.
 *
 * Astro reports route patterns without a trailing slash regardless of the
 * configured mode, so an `astro.config.mjs` redirect like `/old → /new` would
 * emit `source: "/old"` even when canonical URLs are `/old/`. Without this
 * normalization the edge rule misses the canonical request and the redirect
 * falls back to SSR.
 *
 * Skipped for:
 *   - URLs with a query string or fragment (`?` / `#`) — the trailing-slash
 *     convention only applies to the path portion of a URL
 *   - the root `/` (always canonical)
 *   - paths ending in `<*>` — Amplify's wildcard is greedy and matches both
 *     `/blog/foo` and `/blog/foo/` from a single rule
 *   - paths ending in a file-extension-like suffix (e.g. `/sitemap.xml`)
 */
function applyTrailingSlash(path: string, mode: TrailingSlashMode): string {
  // Query strings and fragments aren't part of the path — leave them alone
  // rather than producing broken targets like `/foo/?bar=1/`.
  if (/[?#]/.test(path)) return path;

  if (path === "/" || path.endsWith("<*>") || /\.[a-z0-9]+$/i.test(path)) {
    return path;
  }

  if (mode === "always" && !path.endsWith("/")) return `${path}/`;
  if (mode === "never" && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/**
 * Convert an Astro route pattern to the placeholder syntax Amplify expects.
 *
 * Astro uses `[param]` for a single dynamic segment and `[...rest]` for a
 * catch-all spread. Amplify supports two distinct constructs:
 *
 *   - Named placeholders `<name>` — multiple are allowed in a single rule and
 *     are substituted by name into the target (the AWS "Placeholders" pattern).
 *   - The greedy wildcard `<*>` — must be unique per rule and must appear at
 *     the end of the source, or Amplify silently ignores the rule.
 *
 * Astro's syntax maps cleanly onto these:
 *
 *   - `[param]` → `<param>` (named placeholder)
 *   - `[...spread]` → `<*>` (greedy wildcard; Astro only allows spread as the
 *     trailing segment, which satisfies Amplify's "must be at end" rule)
 *
 * @example
 *   astroPatternToAmplify("/blog/[id]")             // "/blog/<id>"
 *   astroPatternToAmplify("/docs/[...slug]")        // "/docs/<*>"
 *   astroPatternToAmplify("/site/[lang]/[...slug]") // "/site/<lang>/<*>"
 *   astroPatternToAmplify("/old/[a]/[b]")           // "/old/<a>/<b>"
 *   astroPatternToAmplify("/old-page")              // "/old-page"
 */
export function astroPatternToAmplify(pattern: string): string {
  return pattern
    .replace(/\[\.{3}[^\]]+\]/g, "<*>")
    .replace(/\[([^\]]+)\]/g, "<$1>");
}

/**
 * Comparator key for sorting rules from most specific to most generic.
 *
 * Amplify evaluates `customRules` in declaration order, so the more specific
 * rule has to come first. We compare by:
 *   1. Dynamic-segment count, ascending (fewer dynamic segments is more
 *      specific). Both named placeholders (`<name>`) and the greedy wildcard
 *      (`<*>`) count.
 *   2. Source length, descending (longer literal prefix wins ties).
 *
 * Lower tuple values sort earlier — i.e., are more specific.
 */
function specificityKey(source: string): [number, number] {
  const dynamicCount = (source.match(/<[^>]+>/g) ?? []).length;
  return [dynamicCount, -source.length];
}

/**
 * Convert a single Astro redirect route into an Amplify custom rule.
 *
 * Returns `null` for routes that aren't of type `"redirect"`, for redirects
 * with an unsupported status code, or for malformed entries — so callers can
 * `map`+`filter` over the full route list without pre-checking.
 */
export function buildCustomRule(
  route: IntegrationResolvedRoute,
  base: string,
  trailingSlash: TrailingSlashMode,
  logger?: AstroIntegrationLogger,
): AmplifyCustomRule | null {
  if (route.type !== "redirect") return null;

  const config = route.redirect;
  if (!config) {
    logger?.warn(
      `Route "${route.pattern}" is typed as "redirect" but has no destination; skipping.`,
    );
    return null;
  }

  const destination = typeof config === "string" ? config : config.destination;
  const astroStatus: ValidRedirectStatus =
    typeof config === "string" ? 301 : config.status;

  const status = ASTRO_TO_AMPLIFY_STATUS[astroStatus];
  if (!status) {
    logger?.warn(
      `Astro redirect status ${astroStatus} is not supported by AWS Amplify ` +
        `customRules. Skipping route "${route.pattern}" → "${destination}".`,
    );
    return null;
  }

  if (!EXACT_STATUS_CODES.has(astroStatus)) {
    logger?.warn(
      `Astro redirect status ${astroStatus} has no exact Amplify equivalent; ` +
        `emitting "${status}" for "${route.pattern}" → "${destination}". ` +
        `If you depend on the precise HTTP semantics of ${astroStatus}, set ` +
        `the rule manually in the Amplify Console.`,
    );
  }

  const source = applyTrailingSlash(
    astroPatternToAmplify(joinBase(base, route.pattern)),
    trailingSlash,
  );
  // Cross-origin destinations are emitted verbatim; only same-origin paths
  // get the base-path and trailing-slash treatments.
  const target = isAbsoluteUrl(destination)
    ? destination
    : applyTrailingSlash(
        astroPatternToAmplify(joinBase(base, destination)),
        trailingSlash,
      );

  return { source, target, status };
}

/**
 * Build the Amplify customRules payload from the resolved Astro routes.
 *
 * The result is sorted from most specific to most generic so that catch-all
 * patterns can't shadow specific rules at evaluation time.
 */
export function buildCustomRules(
  routes: IntegrationResolvedRoute[],
  base: string,
  trailingSlash: TrailingSlashMode,
  logger?: AstroIntegrationLogger,
): AmplifyCustomRule[] {
  const rules = routes
    .map((route) => buildCustomRule(route, base, trailingSlash, logger))
    .filter((rule): rule is AmplifyCustomRule => rule !== null);

  rules.sort((a, b) => {
    const [aw, al] = specificityKey(a.source);
    const [bw, bl] = specificityKey(b.source);
    return aw !== bw ? aw - bw : al - bl;
  });

  return rules;
}
