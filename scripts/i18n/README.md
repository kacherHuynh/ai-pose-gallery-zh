# i18n tooling (vi / en)

The app renders the original Chinese strings and `src/i18n/translator.ts` swaps them for Vietnamese or English at runtime (DOM text nodes plus `title`, `aria-label`, `placeholder` and `alt`). Nothing in `data/` is modified. All translations are maintained by hand in the TSV files below; no machine-translation API is used.

## Files

| Path | Format | Purpose |
| --- | --- | --- |
| `ui/*.tsv` | `zh<TAB>vi<TAB>en` | Interface strings. `{}` (or `{0}`, `{1}`…) is a placeholder; the captured value is translated recursively. |
| `manual/pose-names.tsv` | `zh<TAB>en<TAB>vi` | All 287 pose names. |
| `manual/categories-hairstyles.tsv` | `zh<TAB>en<TAB>vi` | Systems, categories, angles, costume categories/tags, hair lengths, hairstyles, portrait titles. |
| `glossary/*.tsv` | `type<TAB>zh<TAB>en<TAB>vi` | Atoms used to compose costume names. `type` is `C` (color), `M` (modifier/material) or `N` (garment/noun). |
| `seg.py` | | Segments a costume name into glossary atoms (longest match, dynamic programming) and composes it: EN keeps the Chinese order (`pink knit cardigan`), VI puts the head noun first and colors last (`áo cardigan len dệt kim hồng`). `・` items become comma-separated, `配` becomes "with"/"phối". |
| `build_data_dict.py` | | Collects every displayed label from `data/*-zh.json`, translates it (manual tables first, then `seg.py`) and writes `src/i18n/data-dict.json`. Exits 1 and lists the labels it could not translate. |
| `extract_ui_keys.mjs` | | Parses `src/**/*.ts(x)` with esbuild and writes every Chinese string/template literal to `ui-keys.txt`. |
| `build_ui.py` | | Merges `ui/*.tsv` into `src/i18n/ui-dict.json`, checks placeholder counts, and prints extracted keys that still have no translation. |

## Workflow

```bash
node scripts/i18n/extract_ui_keys.mjs
python3 scripts/i18n/build_data_dict.py
python3 scripts/i18n/build_ui.py
pnpm test        # tests/i18n.test.ts asserts every dataset label has vi + en text with no CJK left
```

Untranslated keys reported by `build_ui.py` that are expected: image-generation prompt text in `src/services/aiGenerator.ts` and the studio style presets (model input, kept in Chinese on purpose), regex/code fragments, and ComfyUI workflow node titles.
