import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { search, suggest } from "../index.js"

// parity.json is written by `sis-build build lucide` from the Python ranker.
const expected = JSON.parse(readFileSync(new URL("./parity.json", import.meta.url)))

for (const [name, icons] of Object.entries(expected)) {
  test(`matches the builder's ranking for "${name}"`, () => {
    assert.deepEqual(suggest(name, { limit: 12 }), icons)
  })
}

test("covers every Lucide icon", () => {
  assert.equal(search.icons.length, 1924)
  assert.equal(search.iconset, "lucide")
})

test("a split tag word matches its own tag, not its pieces' neighbours", () => {
  assert.equal(suggest("triage")[0], "inbox")
})
