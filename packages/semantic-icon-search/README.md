# semantic-icon-search

The runtime behind `semantic-icon-search-lucide`: give it an index and a name,
get icons ranked by meaning. No dependencies and no model, about 60 lines of JavaScript.

Most people want an icon-set package instead:

```sh
npm install semantic-icon-search-lucide
```

Use this one directly when you load the index yourself:

```js
import { createIconSearch } from "semantic-icon-search"

const index = await fetch("/lucide-index.json").then((r) => r.json())
const search = createIconSearch(index)

search.rank("budget", { limit: 3 })   // [{ icon, score, tag }, …]
search.pieces("budget")               // [{ piece: "budget", known: true }]
```

Indexes are built with the Python builder in the
[repo](https://github.com/mike-anderson/semantic-icon-search), which also has
the full API docs.

MIT.
