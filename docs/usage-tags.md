# Usage tags

Icon sets tag what an icon *shows* (`syringe`: needle, medicine). App names
say what an app *does* (`glucose-log`). Usage tags bridge the two: about ten
tags per icon answering "what kind of app would use this as its logo?". They
are written once, offline, and committed as `iconsets/<name>/usage-tags.json`.

On Lucide 1.63.0 (182 labelled blind test names, same index settings) they
took a fair icon in the top 12 from 63% to 70%, and the top 24 from 67% to 77%.
Dictionary expansion (WordNet synonyms, word forms) did nothing measurable.

## Writing them

Split the set's `{icon: [tags]}` into chunks of about 400 icons and give each
chunk to a model with the prompt below. Keep evaluation names away from it:
the writer must see only its chunk, or the eval numbers stop meaning anything.

> For EVERY icon in the file, write 10–15 NEW tags answering: "what kind of
> app, tool, site or project would plausibly use this icon as its logo, and
> what activities/domains does it suggest?" Think about the uses, not the shape.
>
> - syringe → diabetes, insulin, vaccination, clinic, pharmacy, medication reminder, blood test, nurse
> - mic → dictation, transcription, podcast, voice notes, karaoke, recording studio, speech to text
> - wallet → budget, expenses, personal finance, payments, allowance, savings, payroll
>
> Rules: lowercase; 1–3 words each; plain English, no brands unless the icon
> is a brand; don't repeat the icon's existing tags or name; no bare generic
> app words ("app", "tool", "manager", "tracker", "dashboard", "system",
> "platform", "service"), though "habit tracker" is fine; for abstract/UI icons
> give 8–12 tags about where they'd be used; variants (-off, -x, -plus, -check)
> share their base icon's uses plus a few for the variant's meaning.

Output is `{icon: [tag, ...]}`. The builder lowercases tags and ignores the
icon's own tags and name, so duplicates are harmless.
