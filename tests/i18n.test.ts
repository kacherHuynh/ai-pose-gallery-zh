import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { ensureDataDict, matchesQuery, searchAliases, translateText } from '../src/i18n/translator'

const HAN_OR_KANA = /[\u3040-\u30ff\u4e00-\u9fff]/
const root = path.resolve(import.meta.dirname, '..')
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))

function collectDisplayValues(): string[] {
  const values = new Set<string>()
  const add = (v: unknown) => {
    if (typeof v === 'string' && HAN_OR_KANA.test(v)) values.add(v)
  }
  for (const item of readJson('data/pose-zh.json')) ['体系', '分类', '姿势名称', '角度'].forEach((k) => add(item[k]))
  for (const file of ['data/costume-zh.json', 'data/costume-anime-zh.json', 'data/costume-gia-anime-zh.json', 'data/costume-shisei-zh.json']) {
    for (const item of readJson(file)) {
      ;['一级分类', '分类', '来源', '服装名称'].forEach((k) => add(item[k]))
      ;(item['标签'] || []).forEach(add)
    }
  }
  for (const item of readJson('data/portrait-zh.json')) ['分区', '发长', '发型名称', '标题'].forEach((k) => add(item[k]))
  return [...values]
}

test('every displayed dataset label has Vietnamese and English text', async () => {
  await ensureDataDict()
  const values = collectDisplayValues()
  assert.ok(values.length > 2000, `expected the full dataset, got ${values.length}`)
  for (const lang of ['vi', 'en'] as const) {
    const leftovers = values.filter((v) => HAN_OR_KANA.test(translateText(v, lang)))
    assert.deepEqual(leftovers.slice(0, 10), [], `${lang}: ${leftovers.length} untranslated labels`)
  }
})

test('interpolated UI strings and composite labels are translated', async () => {
  await ensureDataDict()
  assert.equal(translateText('加载姿势数据失败: HTTP 404', 'en'), 'Failed to load pose data: HTTP 404')
  assert.equal(
    translateText('[ComfyUI] 工作流与本机不匹配：\n[ComfyUI] 工作流执行出错：boom', 'en'),
    "[ComfyUI] Workflow doesn't match this machine:\n[ComfyUI] Workflow execution error: boom",
  )
  assert.equal(translateText('已选人像：短发・标准款', 'vi'), 'Đã chọn chân dung: Tóc ngắn · Kiểu tiêu chuẩn')
  assert.equal(translateText('站立・双手扶腰 · 正面', 'en'), 'Standing, hands on waist · Front')
  assert.equal(translateText('  全部  ', 'vi'), '  Tất cả  ')
  assert.equal(translateText('全部', 'zh'), '全部')
})

test('search aliases let users search in Vietnamese (with or without accents) and English', async () => {
  await ensureDataDict()
  const haystack = `藏青水手服 ${searchAliases('藏青水手服', '制服与校园风')}`
  assert.ok(matchesQuery(haystack, 'sailor uniform'))
  assert.ok(matchesQuery(haystack, 'đồng phục thủy thủ'))
  assert.ok(matchesQuery(haystack, 'dong phuc thuy thu'))
  assert.ok(matchesQuery(haystack, '水手服'))
  assert.ok(!matchesQuery(haystack, 'bikini'))
})
