# semantic-icon-search-lucide

Suggest [Lucide](https://lucide.dev) icons for a name by what it means.
Runs in the browser with no model and no network request.

```sh
npm install semantic-icon-search-lucide
```

```js
import { search, suggest } from "semantic-icon-search-lucide"

suggest("podcast-studio", { limit: 4 })
// ["mic-signal", "mic-vocal", "mic", "audio-lines"]

search.rank("plant-diary", { limit: 2 })
// [{ icon: "notebook-pen", score: 0.257, tag: "diary" },
//  { icon: "plant-pot", score: 0.212, tag: "plant" }]
```

Built for Lucide 1.63.0 (1,924 icons). The index is about 540 KB gzipped, so
you'll probably want `await import("semantic-icon-search-lucide")` when your
picker opens, rather than a static import. The raw index is also exported as
`semantic-icon-search-lucide/index.json` if you'd rather fetch it and pass it
to `createIconSearch` from
[`semantic-icon-search`](https://www.npmjs.com/package/semantic-icon-search).

Full docs, accuracy numbers and the API are in the
[main README](https://github.com/mike-anderson/semantic-icon-search#readme).

MIT. Lucide's icons and tags are ISC.
