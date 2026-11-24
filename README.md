# AI Character Reference & Studio (3-in-1) · English / Tiếng Việt

**English** · [Tiếng Việt](README.vi.md) · [中文（原文）](README.zh-CN.md)

> This is a localized fork of **[anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)** by Anhao ([X @anhao_ai](https://x.com/anhao_ai)). The app and data are upstream's work; this fork adds a **Vietnamese (default) + English** interface with a language switcher. The original Chinese README is kept as [README.zh-CN.md](README.zh-CN.md) and is the authoritative documentation for features, the ComfyUI plugin and the agent skills.

**Pose library** (1,439 mannequin images + 1,439 depth maps) + **costume library** (3,224 sets: 1,407 Gia realistic, 57 Shisei historical Chinese sets / 227 views, 1,320 Gia anime, 440 CharaDB anime) + **portrait library** (1,499 CC0 portraits), with an **AI character studio** that talks to 5 image APIs and a native **ComfyUI custom-node plugin**.

![Gallery overview](docs/preview.jpg)

**Upstream demo:** <https://ai-pose-gallery.anhao.app/> (Chinese UI)
**Original galleries (Japanese):** [poses](https://ai-pose-gallery.pages.dev/) · [depth](https://ai-pose-depth-gallery.pages.dev/) · [costumes](https://ai-costume-gallery.pages.dev/) · [portraits](https://ai-portrait-gallery.pages.dev/)
**Original gallery author:** Gia (ギア, @giaaibusi). **Anime costumes:** Taki AI ([@taki_auto](https://x.com/taki_auto) · [CharaDB](https://charadb-2fi.pages.dev/)). **Historical Chinese costumes:** Shisei / wquguru (CC0).

## What you get

- **Pose library (`/poses`)**: 4 systems, 26 categories, 288 pose groups, 5 camera angles (front, high angle, low angle, side, three-quarter); switch between the 3D mannequin and the depth map.
- **Costume library (`/costumes`)**: realistic and anime outfits by season/style, item & color tags, and English prompt keywords.
- **Portrait library (`/portraits`)**: front-face and styled shots, 4 hair lengths, 51 Japanese hairstyles, top-10 picks.
- **AI Studio (`/studio`)**: combine portrait + costume + pose (+ extra references), pick a style preset and generate with Google Gemini, OpenAI GPT Image, Alibaba Cloud Bailian (Qwen), Volcengine Ark (Doubao), PixAI or a local ComfyUI. API keys stay in your browser.
- **Safe mode (SFW)** is on by default and hides the 18+ categories.

## Language support (added by this fork)

- Languages: **Tiếng Việt** (default), **English**, and the original **中文**.
- Switch with the language button in the top bar. The choice is stored in `localStorage`; you can also link to a language with `?lang=vi`, `?lang=en` or `?lang=zh`.
- Everything a visitor reads is translated: navigation, filters, buttons, dialogs, toasts, error messages, the age-confirmation dialog, `<title>`/meta/Open Graph tags, and **all dataset labels** (pose names, categories, angles, costume names and tags, hairstyles).
- Search accepts Vietnamese (with or without accents), English or Chinese, e.g. `dong phuc thuy thu`, `sailor uniform` or `水手服`.
- The original Chinese data files in `data/` are untouched. Translation happens at render time (`src/i18n/translator.ts`) through two dictionaries:
  - `src/i18n/ui-dict.json`: interface strings, translated by hand (`scripts/i18n/ui/*.tsv`).
  - `src/i18n/data-dict.json`: 2,312 dataset labels. Pose names, categories and hairstyles are translated by hand (`scripts/i18n/manual/*.tsv`); the ~2,500 costume names are composed from a reviewed glossary of colors, materials and garments (`scripts/i18n/glossary/*.tsv`).
- Intentionally left in Chinese: the image-generation **prompts** the studio sends to models (they are model input, and the Chinese wording is tuned for Qwen/Doubao), and the prompt text box that shows them.

To regenerate the dictionaries after changing the source data or UI:

```bash
node scripts/i18n/extract_ui_keys.mjs     # list Chinese strings in src/
python3 scripts/i18n/build_data_dict.py   # -> src/i18n/data-dict.json (fails if a label can't be translated)
python3 scripts/i18n/build_ui.py          # -> src/i18n/ui-dict.json (prints untranslated UI strings)
pnpm test                                 # includes a check that every dataset label has vi + en text
```

## Run locally

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build to dist/
pnpm lint
pnpm test
```

Local dev serves `data/`, `img/` and `thumbs/` straight from the repo. Deployment is a Cloudflare Worker serving `dist/` (`wrangler.jsonc`, `worker.ts`); see [README.zh-CN.md](README.zh-CN.md) for the ComfyUI plugin, workflows, PixAI and agent-skill setup.

## Disclaimer

1. **Learning and lawful art only.** This project (web studio, ComfyUI plugin, workflows and agent skills) is for personal study, anatomy and pose reference, illustration and technical exchange. Do not use it to create or spread illegal, obscene or violent content, or to face-swap / deepfake real people without their explicit consent.
2. **NSFW (18+) content.** The gallery includes some adult-oriented mannequin poses and lingerie/sexy outfit references. Safe mode hides them by default; **anyone under 18 must not turn it off**.
3. **Sources and copyright.** The original pose, realistic costume and portrait images and metadata belong to **Gia (@giaaibusi)**; the anime costumes belong to **Taki AI** (images load from CharaDB and must not be redistributed; see its [LICENSE](https://github.com/taki-ttt/charadb/blob/main/LICENSE)); the Shisei costumes are CC0 by wquguru. This repository claims no rights over the images. **Do not repackage, resell or distribute the gallery images for profit.** Users are solely responsible for how they use it.

## License

The application code (`src/`), the ComfyUI plugin (`comfyui_plugin/`) and the scripts (`scripts/`) are released under the [MIT License](LICENSE) © 2026 Anhao. The license **does not cover** the images and source data in `img/`, `thumbs/` and `data/`. The localization added in this fork is offered under the same MIT terms.
