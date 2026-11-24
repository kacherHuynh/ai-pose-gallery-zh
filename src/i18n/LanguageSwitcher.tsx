import { LanguagesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LANGS, setLang, type Lang } from './translator'
import { useLang } from './useLang'

const BUTTON_LABEL: Record<Lang, string> = {
  vi: 'Ngôn ngữ',
  en: 'Language',
  zh: '语言',
}

export function LanguageSwitcher() {
  const lang = useLang()
  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2" aria-label={BUTTON_LABEL[lang]} data-no-i18n>
          <LanguagesIcon className="size-4" />
          <span className="text-xs font-semibold">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-no-i18n>
        <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
          {LANGS.map((l) => (
            <DropdownMenuRadioItem key={l.id} value={l.id}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
