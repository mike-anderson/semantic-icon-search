import assert from "node:assert/strict"
import { test } from "node:test"
import { createIconSearch } from "../src/index.js"

const index = {
  format: 1,
  model: "test",
  iconset: "toy",
  version: "0",
  rank: { nameWeight: 0.5, secondTagWeight: 0.5 },
  tags: ["clock", "inbox", "time", "triage"],
  icons: { clock: [0, 2], inbox: [1, 3] },
  rows: ["tri 50 3:40", "##age 50", "triage 80 3:98", "time 90 2:95 0:60", "clock 90 0:99 2:70", "unlinked"].join("\n"),
}

test("ranks by summed piece links", () => {
  const search = createIconSearch(index)
  assert.deepEqual(search.rank("time").map((r) => r.icon), ["clock"])
  assert.equal(search.rank("time")[0].tag, "time")
})

test("a whole-word row beats its pieces", () => {
  const search = createIconSearch(index)
  assert.deepEqual(search.pieces("triage"), [{ piece: "triage", known: true }])
  // tri matches but ##ag does not, so the word is unknown as a whole
  assert.deepEqual(search.pieces("triag"), [{ piece: "triag", known: false }])
  assert.equal(search.rank("triage")[0].icon, "inbox")
})

test("unknown words give no ranking, and all: true keeps library order", () => {
  const search = createIconSearch(index)
  assert.deepEqual(search.rank("zzqx"), [])
  assert.deepEqual(search.rank("zzqx", { all: true }).map((r) => r.icon), ["clock", "inbox"])
})
