/** An index produced by `sis-build build <iconset>`. */
export interface IconIndex {
  format: 1
  model: string
  iconset: string
  version: string
  rank: { nameWeight: number; secondTagWeight: number }
  /** Every distinct tag, sorted. */
  tags: string[]
  /** Icon name → indexes into `tags`. */
  icons: Record<string, number[]>
  /** One line per word piece: `piece weight tag:score tag:score …`. */
  rows: string
}

export interface RankedIcon {
  icon: string
  /** Comparable within one query only. */
  score: number
  /** The icon's strongest matching tag, or null. */
  tag: string | null
}

export interface IconSearch {
  /**
   * Icons ordered by closeness to `name`, best first. Only icons with some
   * link to the name are returned unless `all` is set, in which case the rest
   * follow in library order.
   */
  rank(name: string, options?: { limit?: number; all?: boolean }): RankedIcon[]
  /** How `name` splits into word pieces; `known: false` marks an unknown word. */
  pieces(name: string): { piece: string; known: boolean }[]
  icons: string[]
  iconset: string
  version: string
}

export function createIconSearch(index: IconIndex): IconSearch
