/** URL of the running app (Worker + static assets), e.g. `wrangler dev` or a preview deploy. */
export const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:8787";

/** Optional Chromium binary, for environments with a preinstalled browser of another version. */
export const chromiumPath = process.env.E2E_CHROMIUM_PATH;
