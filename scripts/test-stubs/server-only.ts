/**
 * A no-op stand-in for the `server-only` marker package.
 *
 * `server-only` throws on import outside a React Server Component, which is
 * exactly what it is for — and it means the modules it guards cannot be loaded
 * by a plain Node script. The isolation test needs to call the real functions
 * in lib/portal-data.ts rather than a copy of them, so this maps the marker to
 * nothing for the duration of that run only. See scripts/tsconfig.test.json.
 */
export {};
