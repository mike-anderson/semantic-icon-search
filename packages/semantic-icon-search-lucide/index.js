import { createIconSearch } from "semantic-icon-search"
import index from "./data/index.json" with { type: "json" }

/** Semantic search over Lucide's icons, built for the Lucide version in `search.version`. */
export const search = createIconSearch(index)

/** Lucide icon names ordered by closeness to `name`, best first. */
export const suggest = (name, options) => search.rank(name, options).map((r) => r.icon)
