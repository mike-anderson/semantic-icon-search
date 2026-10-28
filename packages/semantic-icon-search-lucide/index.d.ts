import type { IconSearch } from "semantic-icon-search"

/** Semantic search over Lucide's icons, built for the Lucide version in `search.version`. */
export const search: IconSearch

/** Lucide icon names ordered by closeness to `name`, best first. */
export function suggest(name: string, options?: { limit?: number; all?: boolean }): string[]
