/** Known chains — ids are stored lowercase in Firestore for consistency. */
export const SUPERMARKET_PRESETS: { id: string; label: string }[] = [
  { id: 'pavi', label: 'Pavi' },
  { id: 'lidl', label: 'Lidl' },
  { id: 'spar', label: 'Spar' },
  { id: 'coop', label: 'Coop' },
  { id: 'welbees', label: "Welbee's" },
  { id: 'carrefour', label: 'Carrefour' },
  { id: 'penny', label: 'Penny' }
]

const PRESET_LABEL = new Map(SUPERMARKET_PRESETS.map((p) => [p.id, p.label]))

export const normalizeStoreId = (raw: string | undefined): string | undefined => {
  const t = (raw || '').trim().toLowerCase()
  return t || undefined
}

export const storeLabel = (id: string | undefined): string => {
  const key = normalizeStoreId(id)
  if (!key) return 'No store'
  return PRESET_LABEL.get(key) ?? key.replace(/\b\w/g, (c) => c.toUpperCase())
}

const CHIP_BY_STORE: Record<string, string> = {
  pavi: 'bg-emerald-100 text-emerald-900',
  lidl: 'bg-yellow-100 text-yellow-900',
  spar: 'bg-orange-100 text-orange-900',
  coop: 'bg-sky-100 text-sky-900',
  welbees: 'bg-violet-100 text-violet-900',
  carrefour: 'bg-blue-100 text-blue-900',
  penny: 'bg-rose-100 text-rose-900'
}

const FALLBACK_CHIPS = [
  'bg-green-100 text-green-800',
  'bg-slate-100 text-slate-800',
  'bg-indigo-100 text-indigo-800',
  'bg-fuchsia-100 text-fuchsia-900',
  'bg-cyan-100 text-cyan-900'
]

const hash = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

export const storeChipClass = (id: string | undefined): string => {
  const key = normalizeStoreId(id)
  if (!key) return 'bg-gray-100 text-gray-600'
  return CHIP_BY_STORE[key] ?? FALLBACK_CHIPS[hash(key) % FALLBACK_CHIPS.length]
}

export const presetIdsForDatalist = (): string[] => SUPERMARKET_PRESETS.map((p) => p.id)
