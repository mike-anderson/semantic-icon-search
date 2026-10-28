// Renders the README figures from the real Lucide index, in light and dark.
// Run from the repo root: node docs/visuals/render.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { createIconSearch } from "semantic-icon-search"
import { search } from "semantic-icon-search-lucide"

const sprite = readFileSync(new URL("../../node_modules/lucide-static/sprite.svg", import.meta.url), "utf8")
const symbols = new Map([...sprite.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((m) => [m[1], m[0]]))
const out = (name) => new URL(`./${name}`, import.meta.url)

const HUES = ["#7c3aed", "#d6338a", "#0f8a6c", "#d99a1e", "#2b78d8"]
const THEMES = {
  light: { bg: "#faf9fd", card: "#ffffff", line: "#e6e2ef", fg: "#251f33", muted: "#6f6782", chip: "#f1ecfd", accent: "#7c3aed" },
  dark: { bg: "#151320", card: "#1c1a28", line: "#2f2b3f", fg: "#efedf5", muted: "#a59fb8", chip: "#2b2340", accent: "#b38cff" },
}
const SANS = "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const mix = (a, b, share) => "#" + [1, 3, 5].map((i) => {
  const v = Math.round(parseInt(a.slice(i, i + 2), 16) * share + parseInt(b.slice(i, i + 2), 16) * (1 - share))
  return v.toString(16).padStart(2, "0")
}).join("")
const hueOf = (icon) => HUES[[...icon].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length]

// The gateway's tile: a rounded chicklet with a 3px ledge, tinted by hue.
const tile = (t, icon, x, y, size, dim = 1) => {
  const hue = hueOf(icon)
  const r = size * 0.3, inner = size * 0.5, h = size - 3
  const fill = t === THEMES.light ? hue : mix(hue, t.card, 0.24)
  const ink = t === THEMES.light ? "#ffffff" : hue
  return `<g opacity="${dim}">
    <rect x="${x}" y="${y + 3}" width="${size}" height="${h}" rx="${r}" fill="${hue}" opacity="${t === THEMES.light ? 0.55 : 0.35}"/>
    <rect x="${x}" y="${y}" width="${size}" height="${h}" rx="${r}" fill="${fill}" stroke="${hue}" stroke-width="1"/>
    <use href="#${icon}" x="${x + (size - inner) / 2}" y="${y + (h - inner) / 2}" width="${inner}" height="${inner}"
      fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}
const defs = (icons) => `<defs>${[...new Set(icons)].map((i) => symbols.get(i)).join("")}</defs>`
const svgDoc = (t, w, h, icons, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${defs(icons)}
<rect width="${w}" height="${h}" rx="18" fill="${t.bg}"/>
${body}
</svg>
`

// Figure 1: sprite names and their suggestions.
const NAMES = ["help", "plant-diary", "expense-splitter", "podcast-studio", "password-vault", "pet-vet", "bike-routes", "triage"]
const hero = (t) => {
  const W = 880, rowH = 84, top = 70, H = top + NAMES.length * rowH + 24
  const used = []
  const rows = NAMES.map((name, n) => {
    const ranked = search.rank(name, { limit: 7 })
    const y = top + n * rowH
    used.push(...ranked.map((r) => r.icon))
    const [first, ...rest] = ranked
    return `<g>
      <rect x="24" y="${y}" width="${W - 48}" height="${rowH - 12}" rx="14" fill="${t.card}" stroke="${t.line}"/>
      <text x="48" y="${y + 33}" font-family="${MONO}" font-size="17" font-weight="600" fill="${t.fg}">${esc(name)}</text>
      <text x="48" y="${y + 54}" font-family="${SANS}" font-size="12.5" fill="${t.muted}">via “${esc(first.tag ?? first.icon)}”</text>
      <text x="262" y="${y + 41}" font-family="${SANS}" font-size="18" fill="${t.muted}">→</text>
      ${tile(t, first.icon, 296, y + 9, 52)}
      <text x="358" y="${y + 41}" font-family="${MONO}" font-size="13" font-weight="600" fill="${t.fg}">${esc(first.icon)}</text>
      ${rest.map((r, i) => tile(t, r.icon, 540 + i * 52, y + 17, 38, 1 - i * 0.1)).join("")}
    </g>`
  }).join("")
  const head = `<text x="24" y="40" font-family="${SANS}" font-size="20" font-weight="800" fill="${t.fg}">Sprite name → Lucide icon</text>
    <text x="${W - 24}" y="40" text-anchor="end" font-family="${SANS}" font-size="13" fill="${t.muted}">top pick, then the next six · ranked in the browser, no model</text>`
  return svgDoc(t, W, H, used, head + rows)
}

// Figure 2: why "triage" needs a whole-word row.
const triage = (t) => {
  const index = JSON.parse(readFileSync(new URL("../../packages/semantic-icon-search-lucide/data/index.json", import.meta.url)))
  const tagOf = (piece) => index.rows.split("\n").find((l) => l.startsWith(piece + " ")).split(" ").slice(2, 5).map((p) => {
    const [tid, s] = p.split(":"); return [index.tags[tid], Number(s)]
  })
  const before = createIconSearch({
    ...index,
    rows: index.rows.split("\n").filter((l) => !l.startsWith("triage ")).join("\n"),
    rank: { ...index.rank, secondTagWeight: 1 },
  }).rank("triage", { limit: 4 })
  const after = search.rank("triage", { limit: 4 })
  const W = 880, H = 360
  const chip = (x, y, text, strong) => {
    const w = text.length * 8.6 + 22
    return `<rect x="${x}" y="${y}" width="${w}" height="28" rx="14" fill="${strong ? t.accent : t.chip}"/>
      <text x="${x + w / 2}" y="${y + 19}" text-anchor="middle" font-family="${MONO}" font-size="13.5" font-weight="600" fill="${strong ? "#fff" : t.fg}">${esc(text)}</text>`
  }
  const links = (x, y, pairs) => pairs.map(([tag, s], i) =>
    `<text x="${x}" y="${y + i * 20}" font-family="${SANS}" font-size="13" fill="${t.muted}"><tspan fill="${t.fg}" font-weight="600">${esc(tag)}</tspan> ${s}</text>`).join("")
  const panel = (x, title, sub, chips, linkCols, ranked, good) => `
    <rect x="${x}" y="64" width="404" height="${H - 88}" rx="16" fill="${t.card}" stroke="${t.line}"/>
    <text x="${x + 22}" y="96" font-family="${SANS}" font-size="15" font-weight="700" fill="${t.fg}">${title}</text>
    <text x="${x + 22}" y="116" font-family="${SANS}" font-size="12.5" fill="${t.muted}">${sub}</text>
    ${chips}${linkCols}
    ${ranked.map((r, i) => tile(t, r.icon, x + 22 + i * 60, 246, 44, i ? 0.55 : 1)).join("")}
    <text x="${x + 22}" y="316" font-family="${MONO}" font-size="12.5" font-weight="600" fill="${good ? t.accent : t.muted}">${esc(ranked[0].icon)} ${good ? "✓" : "✗"}</text>`
  const body = `<text x="24" y="40" font-family="${SANS}" font-size="20" font-weight="800" fill="${t.fg}">Why split words get rows of their own</text>
    ${panel(24, "Pieces only", "tri + ##age inherit their own neighbours",
      chip(46, 132, "tri") + chip(126, 132, "##age"), links(46, 186, tagOf("tri")) + links(226, 186, tagOf("##age")), before, false)}
    ${panel(452, "Whole-word row", "the word's own vector, matched exactly",
      chip(474, 132, "triage", true), links(474, 186, tagOf("triage")), after, true)}`
  return svgDoc(t, W, H, [...before, ...after].map((r) => r.icon), body)
}

for (const [mode, t] of Object.entries(THEMES)) {
  writeFileSync(out(`suggestions-${mode}.svg`), hero(t))
  writeFileSync(out(`triage-${mode}.svg`), triage(t))
}
console.log("wrote docs/visuals/{suggestions,triage}-{light,dark}.svg")
