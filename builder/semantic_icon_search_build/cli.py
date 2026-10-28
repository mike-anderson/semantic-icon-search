"""sis-build build <iconset> | sis-build eval <iconset> [--split dev|test]"""
import argparse
import gzip
import json

from . import iconsets
from .index import Ranker, build

MODEL = "minishlab/potion-base-8M"
PARITY_NAMES = ["help", "friends", "glucose", "triage", "dictation", "expense-splitter", "plant-diary", "home-lab", "zzqx"]


def cmd_build(args):
    folder, spec = iconsets.load(args.iconset)
    p = spec["index"]
    payload = build(iconsets.tags(args.iconset), MODEL, p["linksPerPiece"], p["linkMin"], p["bestMin"], p.get("wholeWords", True))
    payload |= {"iconset": spec["name"], "version": spec["version"], "rank": spec["rank"]}
    blob = json.dumps(payload, separators=(",", ":"))
    pkg = iconsets.ROOT / "packages" / spec["package"]
    (pkg / "data").mkdir(exist_ok=True)
    (pkg / "data" / "index.json").write_text(blob)
    ranker = Ranker(payload, spec["rank"]["nameWeight"], spec["rank"]["secondTagWeight"])
    fixtures = {n: [ic for s, ic in ranker.rank(n) if s > 0][:12] for n in PARITY_NAMES}
    (pkg / "test" / "parity.json").write_text(json.dumps(fixtures, indent=1))
    print(f"{spec['name']} {spec['version']}: {len(payload['icons'])} icons, {len(payload['tags'])} tags, "
          f"{len(gzip.compress(blob.encode(), 9)) // 1024} KB gzipped ({len(blob) // 1024} KB raw) → {pkg / 'data' / 'index.json'}")


def cmd_eval(args):
    folder, spec = iconsets.load(args.iconset)
    pkg = iconsets.ROOT / "packages" / spec["package"]
    payload = json.loads((pkg / "data" / "index.json").read_text())
    ranker = Ranker(payload, spec["rank"]["nameWeight"], spec["rank"]["secondTagWeight"])
    rows = [(n, ok) for n, ok in iconsets.eval_set(args.iconset, args.split) if ok]
    ks = (1, 3, 6, 12, 24)
    hits = dict.fromkeys(ks, 0)
    share = 0.0
    for name, ok in rows:
        ranked = [ic for _, ic in ranker.rank(name)]
        for k in ks:
            hits[k] += bool(ok & set(ranked[:k]))
        share += len(ok & set(ranked[:12])) / len(ok)
    print(f"{args.iconset} {args.split}: {len(rows)} labelled names")
    print("  " + "  ".join(f"top{k} {hits[k] / len(rows):.0%}" for k in ks) + f"  | fair icons in top 12 {share / len(rows):.0%}")


def main():
    ap = argparse.ArgumentParser(prog="sis-build")
    sub = ap.add_subparsers(required=True)
    b = sub.add_parser("build", help="build an icon set's index into its package")
    b.add_argument("iconset")
    b.set_defaults(fn=cmd_build)
    e = sub.add_parser("eval", help="score the built index on labelled names")
    e.add_argument("iconset")
    e.add_argument("--split", default="dev", choices=["dev", "test"])
    e.set_defaults(fn=cmd_eval)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
