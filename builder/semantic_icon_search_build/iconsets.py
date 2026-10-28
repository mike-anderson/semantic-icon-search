"""Icon-set definitions: each lives in iconsets/<name>/ with an iconset.json.

iconset.json fields:
  name, version, package       npm package the index ships in
  tags.url                     JSON {icon: [tag, ...]} from the icon set itself
                               ({version} is substituted); omit for name-only sets
  usageTags                    optional file of extra {icon: [tag, ...]}, written
                               offline (see docs/usage-tags.md)
  index                        linksPerPiece, linkMin, bestMin, wholeWords
  rank.nameWeight              share of an icon's score taken by its own name
  rank.secondTagWeight         weight of an icon's second-best tag against its best
"""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "builder" / ".cache"


def load(name):
    folder = ROOT / "iconsets" / name
    spec = json.loads((folder / "iconset.json").read_text())
    return folder, spec


def fetch(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / re.sub(r"[^A-Za-z0-9._-]+", "_", url)
    if not path.exists():
        with urllib.request.urlopen(url) as r:
            path.write_bytes(r.read())
    return json.loads(path.read_text())


def tags(name):
    """{icon: sorted tags}: the icon's name as a phrase, the set's tags, and usage tags."""
    folder, spec = load(name)
    source = fetch(spec["tags"]["url"].format(version=spec["version"])) if "tags" in spec else {}
    usage = json.loads((folder / spec["usageTags"]).read_text()) if "usageTags" in spec else {}
    icons = sorted(set(source) | set(usage))
    out = {}
    for ic in icons:
        ts = {ic.replace("-", " ")} | {t.lower().strip() for t in source.get(ic, [])} | {t.lower().strip() for t in usage.get(ic, [])}
        out[ic] = sorted(t for t in ts if t)
    return out


def eval_set(name, split):
    folder, _ = load(name)
    rows = []
    for line in (folder / "eval" / f"{split}.tsv").read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        sprite, _, fair = line.partition("\t")
        rows.append((sprite.strip(), set(fair.split())))
    return rows
