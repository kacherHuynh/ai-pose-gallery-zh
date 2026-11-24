/**
 * Runtime localization layer (Vietnamese default, English, original Chinese).
 *
 * The upstream app hard-codes Chinese strings in components and ships Chinese
 * data files. Instead of rewriting every component, this module translates the
 * rendered DOM (text nodes + a few attributes) through a zh → [vi, en]
 * dictionary. Source data stays untouched, so filtering, recipes and prompts
 * keep working on the original Chinese values.
 *
 * - ui-dict.json: hand-translated UI strings; `{}` marks an interpolated value.
 * - data-dict.json: pose/costume/portrait labels, built from a glossary
 *   (see scripts/i18n/README.md) and loaded lazily as its own chunk.
 */
import uiDict from './ui-dict.json'

export type Lang = 'vi' | 'en' | 'zh'
type Entry = [vi: string, en: string]

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'zh', label: '中文（原文）', short: '中' },
]

const STORAGE_KEY = 'ai-pose-gallery:lang'
const NEEDS_WORK = /[\u3000-\u303f\u3040-\u30ff\u4e00-\u9fff\uff00-\uffef]/
const HAS_HAN_OR_KANA = /[\u3040-\u30ff\u4e00-\u9fff]/

function isLang(v: unknown): v is Lang {
  return v === 'vi' || v === 'en' || v === 'zh'
}

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return 'vi'
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) {
    try {
      localStorage.setItem(STORAGE_KEY, fromUrl)
    } catch {
      /* storage may be unavailable (private mode) */
    }
    return fromUrl
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    /* ignore */
  }
  return 'vi'
}

let currentLang: Lang = readInitialLang()
const listeners = new Set<() => void>()

export function getLang(): Lang {
  return currentLang
}

export function subscribeLang(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// ---------------------------------------------------------------------------
// Dictionary
// ---------------------------------------------------------------------------

const cache = { vi: new Map<string, string>(), en: new Map<string, string>() }
const misses = new Set<string>()
const exact = new Map<string, Entry>()
interface Pattern {
  re: RegExp
  entry: Entry
  literalLength: number
}
let patterns: Pattern[] = []

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function addEntries(dict: Record<string, Entry>) {
  const added: Pattern[] = []
  for (const [zh, entry] of Object.entries(dict)) {
    if (zh.includes('{}')) {
      const parts = zh.split('{}')
      const re = new RegExp('^' + parts.map(escapeRegExp).join('([\\s\\S]*?)') + '$')
      added.push({ re, entry, literalLength: parts.join('').length })
    } else {
      exact.set(zh, entry)
    }
  }
  patterns = [...patterns, ...added].sort((a, b) => b.literalLength - a.literalLength)
  cache.vi.clear()
  cache.en.clear()
}

addEntries(uiDict as unknown as Record<string, Entry>)

let dataDictPromise: Promise<void> | null = null
/** Loads pose/costume/portrait label translations (separate chunk). */
export function ensureDataDict(): Promise<void> {
  if (!dataDictPromise) {
    dataDictPromise = import('./data-dict.json').then((mod) => {
      addEntries((mod.default ?? mod) as unknown as Record<string, Entry>)
      if (currentLang !== 'zh' && typeof document !== 'undefined') translateTree(document.body)
    })
  }
  return dataDictPromise
}

// ---------------------------------------------------------------------------
// String translation
// ---------------------------------------------------------------------------


const PUNCT: [RegExp, string][] = [
  [/\s*：\s*/g, ': '],
  [/\s*，\s*/g, ', '],
  [/\s*、\s*/g, ', '],
  [/\s*；\s*/g, '; '],
  [/\s*（/g, ' ('],
  [/）/g, ')'],
  [/「|」|『|』/g, '"'],
  [/。/g, '. '],
  [/！/g, '! '],
  [/？/g, '? '],
  [/\s*・\s*/g, ' · '],
]

function normalizePunctuation(s: string): string {
  let out = s
  for (const [re, rep] of PUNCT) out = out.replace(re, rep)
  return out.replace(/ {2,}/g, ' ').replace(/^ \(/, '(')
}

function pick(entry: Entry, lang: 'vi' | 'en') {
  return lang === 'vi' ? entry[0] : entry[1]
}

function fill(template: string, values: string[]): string {
  if (/\{\d\}/.test(template)) return template.replace(/\{(\d)\}/g, (_, i) => values[Number(i)] ?? '')
  let i = 0
  return template.replace(/\{\}/g, () => values[i++] ?? '')
}

const COMPOSITE_SEPARATORS = [/(\s+[·•|｜]\s+)/, /(\s*[、，；：]\s*)/, /(\s*[・·]\s*)/]

function translateCore(core: string, lang: 'vi' | 'en', depth: number): string | null {
  const hit = exact.get(core)
  if (hit) return pick(hit, lang)
  if (depth > 3) return null

  // Dictionary keys are single-line, so translate multi-line text line by line.
  if (core.includes('\n')) {
    return core
      .split('\n')
      .map((line) => translateText(line, lang, depth + 1).replace(/ +$/, ''))
      .join('\n')
  }

  for (const p of patterns) {
    const m = p.re.exec(core)
    if (!m) continue
    const values = m.slice(1).map((v) => translateText(v, lang, depth + 1))
    return fill(pick(p.entry, lang), values)
  }


  // Composite labels such as "姿势名称 · 角度" or "A・B（C）": split on the
  // loosest separator first and translate every part on its own.
  for (const sep of COMPOSITE_SEPARATORS) {
    const parts = core.split(sep)
    if (parts.length < 2) continue
    const out: string[] = []
    let ok = true
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i % 2 === 1 || !HAS_HAN_OR_KANA.test(part)) {
        out.push(part)
        continue
      }
      const translated = translateCore(part.trim(), lang, depth + 1)
      if (translated === null) {
        ok = false
        break
      }
      out.push(translated)
    }
    if (ok) return normalizePunctuation(out.join(''))
  }
  const paren = /^(.+?)[（(](.+)[）)]$/.exec(core)
  if (paren) {
    const head = translateCore(paren[1].trim(), lang, depth + 1)
    const inner = translateCore(paren[2].trim(), lang, depth + 1)
    if (head !== null && inner !== null) return `${head} (${inner})`
  }

  if (!HAS_HAN_OR_KANA.test(core)) return normalizePunctuation(core)
  return null
}

/** Translate one string into `lang`. Unknown strings are returned unchanged. */
export function translateText(input: string, lang: Lang = currentLang, depth = 0): string {
  if (lang === 'zh' || !input || !NEEDS_WORK.test(input)) return input
  const cached = cache[lang].get(input)
  if (cached !== undefined) return cached
  const lead = input.match(/^\s*/)![0]
  const trail = input.slice(lead.length).match(/\s*$/)![0]
  const core = input.slice(lead.length, input.length - trail.length)
  const translated = translateCore(core, lang, depth)
  if (translated === null) {
    if (depth === 0) misses.add(core)
    return input
  }
  const result = lead + translated + trail
  cache[lang].set(input, result)
  return result
}

/** Short alias used by code that formats strings outside the DOM. */
export const t = (zh: string) => translateText(zh)

/** Vietnamese + English labels for a Chinese value, used to widen search. */
export function searchAliases(...values: (string | undefined)[]): string {
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    const vi = translateText(v, 'vi')
    const en = translateText(v, 'en')
    if (vi !== v) out.push(vi, stripDiacritics(vi))
    if (en !== v) out.push(en)
  }
  return out.join(' ').toLowerCase()
}

export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/** Case- and Vietnamese-diacritic-insensitive substring match. */
export function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true
  const h = haystack.toLowerCase()
  const q = query.toLowerCase()
  return h.includes(q) || stripDiacritics(h).includes(stripDiacritics(q))
}

// ---------------------------------------------------------------------------
// DOM translation
// ---------------------------------------------------------------------------

const ATTRS = ['title', 'aria-label', 'placeholder', 'alt', 'aria-description'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'PRE'])

/** Last source (Chinese) value and the output we wrote, per node/attribute. */
const textState = new WeakMap<Text, { src: string; out: string }>()
const attrState = new WeakMap<Element, Map<string, { src: string; out: string }>>()

function isSkipped(el: Element | null): boolean {
  for (let node = el; node; node = node.parentElement) {
    if (SKIP_TAGS.has(node.tagName)) return true
    if (node.hasAttribute('data-no-i18n') || (node as HTMLElement).isContentEditable) return true
  }
  return false
}

function translateTextNode(node: Text) {
  const value = node.nodeValue ?? ''
  const state = textState.get(node)
  // If the current value is what we wrote, the source is unchanged.
  const src = state && value === state.out ? state.src : value
  if (!NEEDS_WORK.test(src)) {
    if (state) textState.delete(node)
    return
  }
  if (isSkipped(node.parentElement)) return
  const out = translateText(src)
  textState.set(node, { src, out })
  if (value !== out) node.nodeValue = out
}

function translateAttributes(el: Element) {
  let map = attrState.get(el)
  for (const name of ATTRS) {
    const value = el.getAttribute(name)
    if (value === null) continue
    const state = map?.get(name)
    const src = state && value === state.out ? state.src : value
    if (!NEEDS_WORK.test(src)) continue
    const out = translateText(src)
    if (!map) {
      map = new Map()
      attrState.set(el, map)
    }
    map.set(name, { src, out })
    if (value !== out) el.setAttribute(name, out)
  }
}

export function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text)
    return
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (isSkipped(root as Element)) return
    translateAttributes(root as Element)
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has((node as Element).tagName)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateTextNode(n as Text)
    else translateAttributes(n as Element)
  }
}

let observer: MutationObserver | null = null

function startObserver() {
  if (observer || typeof MutationObserver === 'undefined') return
  observer = new MutationObserver((records) => {
    if (currentLang === 'zh') return
    for (const r of records) {
      if (r.type === 'characterData') translateTextNode(r.target as Text)
      else if (r.type === 'attributes') translateAttributes(r.target as Element)
      else r.addedNodes.forEach((n) => translateTree(n))
    }
  })
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  })
}

/** Put the original Chinese back on every node we touched (switch to zh). */
function restoreTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  for (let n: Node | null = root; n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const state = textState.get(n as Text)
      if (state && n.nodeValue === state.out) n.nodeValue = state.src
      textState.delete(n as Text)
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const map = attrState.get(n as Element)
      map?.forEach((state, name) => {
        if ((n as Element).getAttribute(name) === state.out) (n as Element).setAttribute(name, state.src)
      })
      attrState.delete(n as Element)
    }
  }
}

// ---------------------------------------------------------------------------
// Document metadata
// ---------------------------------------------------------------------------

const META: Record<Lang, { title: string; description: string; locale: string; htmlLang: string }> = {
  vi: {
    title: 'POSE & CHARACTER Atlas | Thư viện tham chiếu nhân vật AI 3 trong 1 (tư thế · trang phục · chân dung)',
    description:
      'Thư viện tham chiếu nhân vật AI 3 trong 1: 1.439 ảnh tư thế cơ thể nhiều góc, hơn 3.000 bộ trang phục và 1.499 ảnh chân dung kiểu tóc CC0. Ghép "khuôn mặt + trang phục + tư thế" thành công thức nhân vật và tạo ảnh trực tuyến qua gpt-image-1 / Nano Banana.',
    locale: 'vi_VN',
    htmlLang: 'vi',
  },
  en: {
    title: 'POSE & CHARACTER Atlas | AI 3-in-1 character reference library (pose · costume · portrait)',
    description:
      'An AI 3-in-1 character reference library: 1,439 multi-angle body pose images, 3,000+ outfits and 1,499 CC0 hairstyle portraits. Combine "face + outfit + pose" into a character recipe and generate images online with gpt-image-1 / Nano Banana.',
    locale: 'en_US',
    htmlLang: 'en',
  },
  zh: {
    title: 'POSE & CHARACTER Atlas｜AI 角色三合一参考库（姿势 · 服装 · 人像）',
    description:
      'AI 角色三合一参考库收录 1439 张多角度人体姿势图、1407 套服装穿搭与 1499 张 CC0 人像发型参考。支持自由组装「脸 + 衣服 + 姿势」角色配方，配置 gpt-image-1 / Nano Banana 接口即可在线合成角色图。',
    locale: 'zh_CN',
    htmlLang: 'zh-CN',
  },
}

function setMeta(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value)
}

function applyDocumentMeta(lang: Lang) {
  const m = META[lang]
  document.documentElement.lang = m.htmlLang
  document.title = m.title
  setMeta('meta[name="description"]', m.description)
  setMeta('meta[property="og:title"]', m.title)
  setMeta('meta[property="og:description"]', m.description)
  setMeta('meta[property="og:locale"]', m.locale)
  setMeta('meta[name="twitter:title"]', m.title)
  setMeta('meta[name="twitter:description"]', m.description)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function setLang(lang: Lang) {
  if (lang === currentLang) return
  const prev = currentLang
  currentLang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href)
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang)
    window.history.replaceState(window.history.state, '', url)
  }
  applyDocumentMeta(lang)
  if (lang === 'zh') restoreTree(document.body)
  else {
    if (prev === 'zh') restoreTree(document.body)
    translateTree(document.body)
  }
  listeners.forEach((cb) => cb())
}

/** Call once before rendering React. */
export function initI18n() {
  applyDocumentMeta(currentLang)
  const nativeConfirm = window.confirm.bind(window)
  const nativeAlert = window.alert.bind(window)
  window.confirm = (message?: string) => nativeConfirm(message === undefined ? message : translateText(String(message)))
  window.alert = (message?: unknown) => nativeAlert(message === undefined ? message : translateText(String(message)))
  startObserver()
  void ensureDataDict()
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__i18nMisses = misses
  }
}
