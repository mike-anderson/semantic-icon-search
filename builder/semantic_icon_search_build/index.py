"""Word-piece → tag index built from a Model2Vec static embedding model.

A Model2Vec embedding is the mean of its word-piece vectors, so a name's dot
product with a tag splits into a sum over pieces. Storing, per piece, its
vector length and its strongest tag cosines lets the browser reproduce the
model's ranking with lookups and sums, no model at runtime.
"""
import functools
import re

import numpy as np
from model2vec import StaticModel

FORMAT = 1


@functools.cache
def load_model(model_id):
    """Model, its alphabetic vocabulary, raw piece vectors and the largest piece length."""
    model = StaticModel.from_pretrained(model_id)
    vocab = model.tokenizer.get_vocab()
    by_id = {i: t for t, i in vocab.items()}
    keep = [i for i in range(len(model.embedding)) if re.fullmatch(r"(##)?[a-z]+", by_id[i])]
    vectors = np.asarray(model.embedding[keep], dtype=np.float32)
    return model, [by_id[i] for i in keep], vectors, float(np.linalg.norm(vectors, axis=1).max())


def whole_words(model, taglist, vocab):
    """Tag words the tokenizer splits into several pieces, with their summed piece vectors.

    Per-piece links lose these words: "triage" becomes tri + ##age, whose own
    best tags are "triple" and "outage". A row for the whole word keeps its
    composite meaning, and greedy longest-match picks it before the pieces.
    """
    words = sorted({w for t in taglist for w in re.findall(r"[a-z]{3,}", t)} - vocab)
    out = {}
    for w in words:
        ids = model.tokenizer.encode(w, add_special_tokens=False).ids
        if len(ids) > 1:
            out[w] = np.asarray(model.embedding[ids], dtype=np.float32).sum(axis=0)
    return out


def unit(x):
    return x / np.maximum(np.linalg.norm(x, axis=-1, keepdims=True), 1e-9)


def build(tags, model_id, links_per_piece, link_min, best_min, whole_word_rows=True):
    """Index payload for {icon: [tag, ...]}.

    Each piece keeps up to `links_per_piece` tag links scoring at least
    `link_min`; its single best link survives down to `best_min`. Scores are
    cosines minus the piece's median cosine, ×100. A piece's weight is its
    vector length on a 1–100 scale, since the model shortens common words.
    """
    model, pieces, raw, max_norm = load_model(model_id)
    icons = list(tags)
    taglist = sorted({t for ts in tags.values() for t in ts})
    tag_pos = {t: i for i, t in enumerate(taglist)}
    tag_vectors = unit(model.encode(taglist))
    if whole_word_rows:
        extra = whole_words(model, taglist, set(pieces))
        pieces = pieces + list(extra)
        raw = np.vstack([raw, *extra.values()]) if extra else raw
    vectors = unit(raw)
    weights = np.maximum(1, np.round(np.linalg.norm(raw, axis=1) / max_norm * 100)).astype(int)
    lines = []
    for start in range(0, len(pieces), 2000):
        cos = vectors[start : start + 2000] @ tag_vectors.T
        cos -= np.median(cos, axis=1, keepdims=True)
        q = np.round(cos * 100).astype(np.int16)
        k = min(links_per_piece, q.shape[1] - 1)
        top = np.argpartition(-q, k, axis=1)[:, :k]
        for row in range(len(q)):
            order = sorted(top[row], key=lambda j: -q[row, j])
            links = [(int(j), int(q[row, j])) for n, j in enumerate(order) if q[row, j] >= (best_min if n == 0 else link_min)]
            piece = pieces[start + row]
            lines.append(" ".join([piece] + ([str(weights[start + row])] if links else []) + [f"{j}:{s}" for j, s in links]))
    return {
        "format": FORMAT,
        "model": model_id,
        "tags": taglist,
        "icons": {ic: sorted({tag_pos[t] for t in tags[ic]}) for ic in icons},
        "rows": "\n".join(sorted(lines)),
    }


class Ranker:
    """Python twin of the JS runtime, for evaluation and parity fixtures."""

    def __init__(self, payload, name_weight, second_tag_weight):
        self.icons = list(payload["icons"])
        self.tags_of = list(payload["icons"].values())
        tag_pos = {t: i for i, t in enumerate(payload["tags"])}
        self.name_tag = [tag_pos.get(ic.replace("-", " "), -1) for ic in self.icons]
        self.name_weight = name_weight
        self.second_tag_weight = second_tag_weight
        self.table = {}
        for line in payload["rows"].split("\n"):
            piece, *rest = line.split(" ")
            w = int(rest[0]) if rest else 0
            self.table[piece] = (w, [tuple(map(int, p.split(":"))) for p in rest[1:]])

    def pieces(self, word):
        out, s = [], 0
        while s < len(word):
            for e in range(len(word), s, -1):
                p = ("##" if s else "") + word[s:e]
                if p in self.table:
                    out.append(p)
                    s = e
                    break
            else:
                return []
        return out

    def rank(self, name):
        sums, weight = {}, 0
        for word in re.findall(r"[a-z]+", name.lower()):
            for p in self.pieces(word):
                w, links = self.table[p]
                weight += w
                for t, s in links:
                    sums[t] = sums.get(t, 0) + w * s
        scores = []
        for k, tag_ids in enumerate(self.tags_of):
            vals = sorted((sums.get(t, 0) for t in tag_ids), reverse=True)
            b = self.second_tag_weight
            tags = (vals[0] + b * vals[1]) / (1 + b) if len(vals) > 1 else vals[0]
            own = sums.get(self.name_tag[k], 0)
            score = (self.name_weight * own + (1 - self.name_weight) * tags) / weight / 100 if weight else 0
            scores.append((score, k))
        scores.sort(key=lambda sk: (-sk[0], sk[1]))
        return [(s, self.icons[k]) for s, k in scores]
