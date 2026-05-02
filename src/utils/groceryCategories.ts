/**
 * Product-style aisles for supermarket items (not the store chain).
 * `inferGroceryCategory` uses English/German-ish keywords common on Lidl-style receipts.
 */

export const GROCERY_PRESETS: { id: string; label: string }[] = [
  { id: 'meat_poultry', label: 'Meat & poultry' },
  { id: 'fish', label: 'Fish & seafood' },
  { id: 'produce', label: 'Fruit & vegetables' },
  { id: 'dairy_eggs', label: 'Dairy & eggs' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'beverages', label: 'Soft drinks & water' },
  { id: 'snacks_sweets', label: 'Snacks & sweets' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'pantry', label: 'Pantry & cooking' },
  { id: 'plant_based', label: 'Plant-based' },
  { id: 'household', label: 'Household & cleaning' },
  { id: 'other', label: 'Other' }
]

const LABEL = new Map(GROCERY_PRESETS.map((p) => [p.id, p.label]))

export const normalizeGroceryId = (raw: string | undefined): string | undefined => {
  const t = (raw || '').trim().toLowerCase().replace(/\s+/g, '_')
  if (!t) return undefined
  if (LABEL.has(t)) return t
  return t.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || undefined
}

export const groceryLabel = (id: string | undefined): string => {
  const key = id?.trim().toLowerCase()
  if (!key) return 'No category'
  return LABEL.get(key) ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const CHIP: Record<string, string> = {
  meat_poultry: 'bg-rose-100 text-rose-900',
  fish: 'bg-cyan-100 text-cyan-900',
  produce: 'bg-lime-100 text-lime-900',
  dairy_eggs: 'bg-amber-100 text-amber-900',
  bakery: 'bg-orange-100 text-orange-900',
  beverages: 'bg-sky-100 text-sky-900',
  snacks_sweets: 'bg-pink-100 text-pink-900',
  frozen: 'bg-indigo-100 text-indigo-900',
  pantry: 'bg-yellow-100 text-yellow-900',
  plant_based: 'bg-green-100 text-green-900',
  household: 'bg-slate-200 text-slate-900',
  other: 'bg-gray-100 text-gray-700'
}

export const groceryChipClass = (id: string | undefined): string => {
  const k = id?.trim().toLowerCase()
  if (!k) return 'bg-gray-100 text-gray-500'
  return CHIP[k] ?? 'bg-purple-100 text-purple-900'
}

export const groceryPresetIds = (): string[] => GROCERY_PRESETS.map((p) => p.id)

/** Rows for a native `<select>`: always shows labels; includes current value if it is a custom id. */
export const groceryDropdownRows = (
  currentId: string | undefined
): { value: string; label: string }[] => {
  const presetIds = new Set(GROCERY_PRESETS.map((p) => p.id))
  const rows = GROCERY_PRESETS.map((p) => ({ value: p.id, label: p.label }))
  const cur = normalizeGroceryId(currentId)
  if (cur && !presetIds.has(cur)) {
    rows.push({ value: cur, label: `${groceryLabel(cur)} (custom)` })
  }
  return rows
}

const has = (t: string, re: RegExp) => re.test(t)

export const inferGroceryCategory = (rawName: string): string => {
  const t = rawName.toLowerCase().normalize('NFKD').replace(/\s+/g, ' ')

  if (has(t, /\b(detergent|laundry|ariel|persil|pods|kitchen towel|toilet|bleach|sponge|foil|cling|cleaner|wc-|fabric|tissue|paper roll|refill|dishwash|spülm|reinig)\b/)) {
    return 'household'
  }
  if (
    has(t, /\b(water|cola|coca|pepsi|fanta|sprite|juice|soda|zero|isotonic|energy|beer|wine|lager|prosecco|spritz|tea\b|coffee|limon|limo|drink|getränk|saft)\b/)
  ) {
    return 'beverages'
  }
  if (
    has(
      t,
      /\b(chocolate|nut\b|peanut|snack|crisp|chip|biscuit|cookie|candy|sweet|popcorn|riegel|bar\b|gummi|haribo|praline)\b/
    )
  ) {
    return 'snacks_sweets'
  }
  if (has(t, /\b(frozen|ice cream|eis|gelato|tiefkühl|tk-|surgel)\b/)) {
    return 'frozen'
  }
  if (has(t, /\b(fish|salmon|tuna|prawn|shrimp|cod|seafood|anchov|forelle|lachs|thunfisch)\b/)) {
    return 'fish'
  }
  if (
    has(
      t,
      /\b(banana|potato|tomato|tomaten|carrot|onion|spinach|spinat|grape|cucumber|lemon|apple|orange|clementine|parsley|mushroom|salad|broccoli|lettuce|avocado|celery|garlic|ginger|pineapple|melon|herb|bio\b|aubergine|courgette|zucchini|sweet pepper|bell pepper|snacking pepper|pointed pepper|peppers|chili|chilli|beans|peas|corn|beet|radish|salat|zwiebel|möhre|karotte|kartoffel|gurke|cherry|datte|dattel|kohl|kraut|sellerie|ingwer|zwiebeln|grapes|chestnut|kastanie)\b/
    )
  ) {
    return 'produce'
  }
  if (
    has(
      t,
      /\b(chicken|beef|pork|turkey|lamb|mince|minced|thigh|breast|slice|ham|burger|bacon|sausage|wurst|salami|meat|fillet|rib|tender|bresaola|boneles|boneless|chick\b|hambur|schnitzel|steak|veal|rind|pute|geflügel|hackfleisch|roulad|wurstchen)\b/
    )
  ) {
    return 'meat_poultry'
  }
  if (
    has(
      t,
      /\b(milk|yogurt|yoghurt|cheese|butter|cream|feta|ricotta|mozzarella|quark|cottage|greek|fromage|käse|milch|ei(er)?\b|egg)\b/
    )
  ) {
    return 'dairy_eggs'
  }
  if (
    has(
      t,
      /\b(bread|baguette|loaf|brioche|croissant|donut|muffin|pastry|toast|brötchen|brot|semmel|rollen|rye|sliced loaf|bagels)\b/
    )
  ) {
    return 'bakery'
  }
  if (
    has(
      t,
      /\b(vegan|tofu|plant-based|plant based|oat drink|hafer|hummus|houmous|humus|chickpea spread)\b/
    )
  ) {
    return 'plant_based'
  }
  if (
    has(
      t,
      /\b(pasta|rice|noodle|oil|olive|olive oil|olivenöl|olivenol|extra virgin|evoo|cooking oil|vegetable oil|sunflower oil|rapeseed|canola|sesame oil|coconut oil|flour|sugar|brown sugar|icing sugar|caster sugar|cereal|mustard|mayo|mayonnaise|mayonese|senf|ketchup|honey|jam|vinegar|stock|soup|spice|salt|sea salt|rock salt|pepper|sauce|aioli|remoulade|dressing|relish|mehl|öl|nudeln|reis|gewürz|salz|zucker|rohrzucker)\b/
    )
  ) {
    return 'pantry'
  }
  return 'other'
}
