<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-800">📥 Import Receipt</h2>
        <button
          @click="handleCancel"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="state === 'idle'">
          <p class="text-sm text-gray-600 mb-4">
            Upload a receipt JSON file. Items will be matched against your existing supermarket
            list — new ones get created, existing ones get a new price entry. You can save an
            updated JSON to a folder on your computer before or after importing (same order as
            the original file; skipped lines like deposits are kept as-is).
          </p>
          <label
            class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <span class="text-4xl mb-2">📄</span>
            <span class="text-sm text-gray-600">Click to choose a .json file</span>
            <input
              type="file"
              accept="application/json,.json"
              class="hidden"
              @change="handleFileChange"
            />
          </label>
        </div>

        <div v-else-if="state === 'parsing'" class="text-center py-12">
          <p class="text-gray-600">Parsing receipt…</p>
        </div>

        <div v-else-if="state === 'preview' && parsed" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Receipt Date</label>
              <input
                v-model="receiptDate"
                type="date"
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Store (new items)</label>
              <input
                v-model="supermarketInput"
                type="text"
                list="receipt-import-store-presets"
                autocomplete="off"
                placeholder="Leave empty or type / pick…"
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <datalist id="receipt-import-store-presets">
                <option v-for="id in supermarketPresetIds" :key="id" :value="id" />
              </datalist>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Store</label>
              <p class="text-sm text-gray-800 truncate" :title="parsed.store">
                {{ parsed.store || '—' }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
            <div class="space-x-3 flex flex-wrap gap-y-1">
              <span class="text-green-700 font-medium">{{ counts.newCount }} new</span>
              <span class="text-blue-700 font-medium">{{ counts.updateCount }} update</span>
              <span class="text-gray-500">{{ counts.skippedCount }} unchecked</span>
              <span v-if="parsed.skippedCount > 0" class="text-gray-400">
                ({{ parsed.skippedCount }} discount/deposit lines auto-skipped)
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="setAllInclude(true)"
                class="text-blue-600 hover:underline text-xs"
              >
                Select all
              </button>
              <button
                @click="setAllInclude(false)"
                class="text-blue-600 hover:underline text-xs"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div
              v-for="(row, index) in rows"
              :key="index"
              class="flex items-start gap-2 p-3 border-b border-gray-100 last:border-b-0"
              :class="{ 'bg-gray-50 opacity-60': !row.include }"
            >
              <input
                v-model="row.include"
                type="checkbox"
                class="mt-2 h-4 w-4"
              />
              <div class="flex-1 grid grid-cols-12 gap-2 items-end">
                <div class="col-span-12 md:col-span-5">
                  <input
                    v-model="row.title"
                    type="text"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                  />
                  <div class="mt-1 flex items-center gap-2 flex-wrap">
                    <span
                      v-if="!row.existingItem"
                      class="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold"
                    >
                      NEW
                    </span>
                    <span
                      v-else
                      class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold"
                    >
                      UPDATE
                    </span>
                    <span
                      v-if="row.existingItem && getPrev(row) !== null"
                      class="text-xs text-gray-500"
                    >
                      €{{ getPrev(row)!.toFixed(2) }} → €{{ row.unitPrice.toFixed(2) }}
                    </span>
                    <span v-if="row.isWeighed" class="text-xs text-gray-500">per kg</span>
                  </div>
                </div>
                <div class="col-span-12 sm:col-span-6 md:col-span-3">
                  <label class="block text-xs text-gray-500 mb-0.5">Product type</label>
                  <select
                    v-model="row.groceryCategory"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option
                      v-for="o in groceryDropdownRows(row.groceryCategory)"
                      :key="`${index}-${o.value}`"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </option>
                  </select>
                </div>
                <div class="col-span-6 sm:col-span-3 md:col-span-2">
                  <label class="block text-xs text-gray-500">
                    {{ row.isWeighed ? '€/kg' : 'Unit €' }}
                  </label>
                  <input
                    v-model.number="row.unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div class="col-span-6 sm:col-span-3 md:col-span-2">
                  <label class="block text-xs text-gray-500">Qty</label>
                  <input
                    v-model.number="row.quantity"
                    type="number"
                    step="1"
                    min="1"
                    class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            <div v-if="rows.length === 0" class="p-6 text-center text-gray-500 text-sm">
              No items found in this receipt.
            </div>
          </div>
        </div>

        <div v-else-if="state === 'saving'" class="text-center py-12">
          <p class="text-gray-600">Saving items…</p>
        </div>

        <div v-else-if="state === 'done' && summary" class="text-center py-8 space-y-3">
          <p class="text-3xl">✅</p>
          <p class="text-lg font-semibold">Import complete</p>
          <p class="text-sm text-gray-600">
            {{ summary.created }} created · {{ summary.updated }} updated
            <span v-if="summary.skipped > 0">· {{ summary.skipped }} skipped</span>
          </p>
          <button
            type="button"
            @click="handleExportJson"
            :disabled="exportingJson"
            class="px-4 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {{ exportingJson ? 'Saving…' : '💾 Save updated JSON to folder…' }}
          </button>
          <div v-if="summary.failed.length > 0" class="text-left bg-red-50 p-3 rounded">
            <p class="text-sm font-semibold text-red-800 mb-1">
              {{ summary.failed.length }} failed:
            </p>
            <ul class="text-xs text-red-700 list-disc list-inside">
              <li v-for="(f, i) in summary.failed" :key="i">{{ f.title }}: {{ f.error }}</li>
            </ul>
          </div>
        </div>

        <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {{ errorMessage }}
        </div>
        <div
          v-if="saveHint"
          class="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm"
        >
          {{ saveHint }}
        </div>
      </div>

      <div class="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
        <button
          v-if="state === 'preview'"
          @click="resetToIdle"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
        >
          Choose another file
        </button>
        <button
          v-if="state === 'preview'"
          @click="handleExportJson"
          :disabled="exportingJson || !receiptDate || !rawReceipt"
          class="px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50"
        >
          {{ exportingJson ? 'Saving…' : '💾 Save JSON' }}
        </button>
        <button
          v-if="state === 'preview'"
          @click="handleSave"
          :disabled="counts.includedCount === 0 || !receiptDate"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          Save {{ counts.includedCount }} item{{ counts.includedCount === 1 ? '' : 's' }}
        </button>
        <button
          v-if="state === 'done'"
          @click="handleClose"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Close
        </button>
        <button
          v-if="state !== 'done'"
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
        >
          {{ state === 'preview' ? 'Cancel' : 'Close' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ListItem } from '@/types'
import type { ParsedReceipt, ReceiptJson, ReceiptRow } from '@/types/receipt'
import { parseReceiptFile } from '@/utils/receiptParser'
import { getLatestPrice, matchReceiptItems } from '@/utils/receiptMatcher'
import { buildMergedReceipt, saveReceiptJsonToDisk } from '@/utils/receiptExport'
import { useItemsStore } from '@/stores/items'
import { normalizeStoreId, presetIdsForDatalist } from '@/utils/supermarketStores'
import { groceryDropdownRows } from '@/utils/groceryCategories'

const props = defineProps<{
  existingItems: ListItem[]
}>()

const emit = defineEmits<{
  done: []
  cancel: []
}>()

type DialogState = 'idle' | 'parsing' | 'preview' | 'saving' | 'done'

const itemsStore = useItemsStore()
const state = ref<DialogState>('idle')
const errorMessage = ref<string | null>(null)
const parsed = ref<ParsedReceipt | null>(null)
const rows = ref<ReceiptRow[]>([])
const receiptDate = ref<string>('')
const supermarketCategory = ref<string | undefined>(undefined)
const supermarketPresetIds = presetIdsForDatalist()

const supermarketInput = computed({
  get: () => supermarketCategory.value ?? '',
  set: (v: string) => {
    supermarketCategory.value = normalizeStoreId(v)
  }
})
const summary = ref<{
  created: number
  updated: number
  skipped: number
  failed: { title: string; error: string }[]
} | null>(null)

const rawReceipt = ref<ReceiptJson | null>(null)
const suggestedFileName = ref('receipt.json')
const exportingJson = ref(false)
const saveHint = ref<string | null>(null)

const counts = computed(() => {
  const included = rows.value.filter((r) => r.include)
  return {
    includedCount: included.length,
    newCount: included.filter((r) => !r.existingItem).length,
    updateCount: included.filter((r) => r.existingItem).length,
    skippedCount: rows.value.length - included.length
  }
})

const getPrev = (row: ReceiptRow) => getLatestPrice(row.existingItem)

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  errorMessage.value = null
  state.value = 'parsing'
  try {
    const { parsed: p, raw } = await parseReceiptFile(file)
    parsed.value = p
    rawReceipt.value = raw
    suggestedFileName.value = file.name && file.name.toLowerCase().endsWith('.json')
      ? file.name
      : `${file.name || 'receipt'}.json`
    rows.value = matchReceiptItems(p, props.existingItems)
    receiptDate.value = p.date
    supermarketCategory.value = p.supermarketCategory
    saveHint.value = null
    state.value = 'preview'
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to parse receipt.'
    state.value = 'idle'
  } finally {
    input.value = ''
  }
}

const setAllInclude = (value: boolean) => {
  rows.value.forEach((r) => (r.include = value))
}

const resetToIdle = () => {
  parsed.value = null
  rawReceipt.value = null
  suggestedFileName.value = 'receipt.json'
  rows.value = []
  receiptDate.value = ''
  supermarketCategory.value = undefined
  errorMessage.value = null
  saveHint.value = null
  state.value = 'idle'
}

const handleExportJson = async () => {
  if (!rawReceipt.value || !receiptDate.value) {
    errorMessage.value = 'Nothing to export yet.'
    return
  }
  exportingJson.value = true
  errorMessage.value = null
  saveHint.value = null
  try {
    const merged = buildMergedReceipt(rawReceipt.value, rows.value, receiptDate.value)
    const how = await saveReceiptJsonToDisk(merged, suggestedFileName.value)
    saveHint.value =
      how === 'picker'
        ? 'JSON saved to the folder and file you picked.'
        : 'JSON download started — move it into your receipts folder if you like.'
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    errorMessage.value = err?.message || 'Could not save JSON.'
  } finally {
    exportingJson.value = false
  }
}

const handleSave = async () => {
  if (!receiptDate.value) {
    errorMessage.value = 'Please choose a date.'
    return
  }
  errorMessage.value = null
  state.value = 'saving'
  try {
    const result = await itemsStore.bulkUpsertFromReceipt(rows.value, {
      date: new Date(receiptDate.value).toISOString(),
      supermarketCategory: supermarketCategory.value
    })
    summary.value = result
    state.value = 'done'
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to save items.'
    state.value = 'preview'
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleClose = () => {
  emit('done')
}
</script>
