# semantic-icon-search-lucide

Suggest [Lucide](https://lucide.dev) icons for a name by meaning, in the
browser, with no model at runtime. Built for Lucide 1.63.0.

```js
import { search, suggest } from "semantic-icon-search-lucide"

suggest("glucose-log", { limit: 6 })   // icon names, best first
search.rank("help", { limit: 12 })     // [{ icon, score, tag }]
search.pieces("triage")                // how the name was split
```

The index is about 540 KB gzipped; import it lazily if that matters
(`import("semantic-icon-search-lucide")`), or load `semantic-icon-search-lucide/index.json`
yourself and pass it to `createIconSearch` from `semantic-icon-search`.

Rebuild from the repo root with `npm run build:lucide`.
