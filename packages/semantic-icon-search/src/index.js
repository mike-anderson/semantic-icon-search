/**
 * Ranks the icons of an index built by `sis-build` by how close each is in
 * meaning to a name. Lookups and sums only; no model runs here.
 *
 * @param {import("./index.d.ts").IconIndex} index
 * @returns {import("./index.d.ts").IconSearch}
 */
export const createIconSearch = (index) => {
  if (index.format !== 1) throw new Error(`semantic-icon-search: unsupported index format ${index.format}`)
  const icons = Object.keys(index.icons)
  const tagsOf = Object.values(index.icons)
  const tagPos = new Map(index.tags.map((t, i) => [t, i]))
  const nameTag = icons.map((icon) => tagPos.get(icon.replaceAll("-", " ")) ?? -1)
  const { nameWeight, secondTagWeight } = index.rank
  const table = new Map()
  for (const line of index.rows.split("\n")) {
    const [piece, w, ...pairs] = line.split(" ")
    table.set(piece, { w: Number(w ?? 0), links: pairs.map((p) => p.split(":").map(Number)) })
  }

  // Greedy longest-match WordPiece, as BERT does it: a word with any
  // unmatchable stretch is unknown as a whole.
  const wordPieces = (word) => {
    const out = []
    for (let s = 0; s < word.length;) {
      let e = word.length
      for (; e > s; e--) if (table.has((s ? "##" : "") + word.slice(s, e))) break
      if (e === s) return [{ piece: word, known: false }]
      out.push({ piece: (s ? "##" : "") + word.slice(s, e), known: true })
      s = e
    }
    return out
  }

  const pieces = (name) => (name.toLowerCase().match(/[a-z]+/g) ?? []).flatMap(wordPieces)

  const rank = (name, { limit = Infinity, all = false } = {}) => {
    const sum = new Float64Array(index.tags.length)
    let weight = 0
    for (const { piece, known } of pieces(name)) {
      if (!known) continue
      const { w, links } = table.get(piece)
      weight += w
      for (const [t, q] of links) sum[t] += w * q
    }
    const ranked = icons.map((icon, i) => {
      const vals = tagsOf[i].map((t) => [sum[t], t]).sort((a, b) => b[0] - a[0])
      const tags = vals.length > 1 ? (vals[0][0] + secondTagWeight * vals[1][0]) / (1 + secondTagWeight) : vals[0][0]
      const own = nameTag[i] >= 0 ? sum[nameTag[i]] : 0
      const score = weight ? (nameWeight * own + (1 - nameWeight) * tags) / weight / 100 : 0
      return { icon, i, score, tag: vals[0][0] > 0 ? index.tags[vals[0][1]] : null }
    })
    ranked.sort((a, b) => b.score - a.score || a.i - b.i)
    return (all ? ranked : ranked.filter((r) => r.score > 0)).slice(0, limit).map(({ icon, score, tag }) => ({ icon, score, tag }))
  }

  return { rank, pieces, icons, iconset: index.iconset, version: index.version }
}
