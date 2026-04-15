<script setup>
import { inject, ref, reactive, computed, watch } from 'vue'
import { GROUPS, GROUP_KEYS, QF_TEMPLATE, ADVANCEMENT } from '../tournament.js'

const t = inject('tournament')

// ── Bracket winners state ──
const winners = reactive({})
function resetWinners() {
  const ids = ['qf1','qf2','qf3','qf4','qf5','qf6','qf7','qf8','sf1','sf2','sf3','sf4','f1','f2','gf']
  ids.forEach(id => { winners[id] = null })
}
resetWinners()

// Reset winners when builder order changes
watch(() => JSON.stringify(t.builderOrder), () => { resetWinners() })

// ── Match data from builder order ──
function bTeam(group, rank) { return t.builderOrder[group][rank] }

const qfMatches = computed(() => [
  { id: 'qf1', label: 'A1 vs B4', home: bTeam('A',0), away: bTeam('B',3), hTag:'A1', aTag:'B4' },
  { id: 'qf2', label: 'C2 vs D3', home: bTeam('C',1), away: bTeam('D',2), hTag:'C2', aTag:'D3' },
  { id: 'qf3', label: 'B1 vs A4', home: bTeam('B',0), away: bTeam('A',3), hTag:'B1', aTag:'A4' },
  { id: 'qf4', label: 'D2 vs C3', home: bTeam('D',1), away: bTeam('C',2), hTag:'D2', aTag:'C3' },
  { id: 'qf5', label: 'C1 vs D4', home: bTeam('C',0), away: bTeam('D',3), hTag:'C1', aTag:'D4' },
  { id: 'qf6', label: 'A2 vs B3', home: bTeam('A',1), away: bTeam('B',2), hTag:'A2', aTag:'B3' },
  { id: 'qf7', label: 'D1 vs C4', home: bTeam('D',0), away: bTeam('C',3), hTag:'D1', aTag:'C4' },
  { id: 'qf8', label: 'B2 vs A3', home: bTeam('B',1), away: bTeam('A',2), hTag:'B2', aTag:'A3' },
])

// Derive later round teams from winners
function getMatchTeams(id) {
  const qf = qfMatches.value.find(m => m.id === id)
  if (qf) return { home: qf.home, away: qf.away, hTag: qf.hTag, aTag: qf.aTag }
  // For SF/F/GF, derive from advancement
  const map = {
    sf1: { h: 'qf1', a: 'qf2' }, sf2: { h: 'qf3', a: 'qf4' },
    sf3: { h: 'qf5', a: 'qf6' }, sf4: { h: 'qf7', a: 'qf8' },
    f1: { h: 'sf1', a: 'sf2' }, f2: { h: 'sf3', a: 'sf4' },
    gf: { h: 'f1', a: 'f2' },
  }
  const src = map[id]
  if (!src) return { home: null, away: null }
  return { home: winners[src.h] || null, away: winners[src.a] || null }
}

// Pick winner and cascade
function pickWinner(matchId, team) {
  if (!team) return
  const current = winners[matchId]
  // Toggle off
  if (current === team) {
    clearFrom(matchId)
    return
  }
  clearFrom(matchId)
  winners[matchId] = team
}

function clearFrom(matchId) {
  winners[matchId] = null
  // Clear downstream
  const adv = ADVANCEMENT[matchId]
  if (adv) clearFrom(adv.next)
}

const champion = computed(() => winners.gf || null)

// ── Drag & Drop (same as before) ──
const dragData = ref(null)
const dragOverTarget = ref(null)

function onDragStart(group, index, event) {
  dragData.value = { group, index }
  event.dataTransfer.effectAllowed = 'move'
}
function onDragEnd() { dragData.value = null; dragOverTarget.value = null }
function onDragOver(group, index, event) {
  if (dragData.value && dragData.value.group === group) {
    event.preventDefault(); dragOverTarget.value = `${group}-${index}`
  }
}
function onDragLeave() { dragOverTarget.value = null }
function onDrop(group, toIndex, event) {
  event.preventDefault(); dragOverTarget.value = null
  if (!dragData.value || dragData.value.group !== group) return
  if (dragData.value.index !== toIndex) t.swapBuilderTeams(group, dragData.value.index, toIndex)
}

// Touch D&D
const touchDragEl = ref(null)
let touchClone = null
function onTouchStart(group, index, event) {
  dragData.value = { group, index }; touchDragEl.value = event.currentTarget
  touchClone = event.currentTarget.cloneNode(true)
  touchClone.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:0.85;width:' + event.currentTarget.offsetWidth + 'px;'
  document.body.appendChild(touchClone)
  const tc = event.touches[0]; touchClone.style.left = tc.clientX-30+'px'; touchClone.style.top = tc.clientY-20+'px'
}
function onTouchMove(event) {
  event.preventDefault(); if (!touchClone) return
  const tc = event.touches[0]; touchClone.style.left = tc.clientX-30+'px'; touchClone.style.top = tc.clientY-20+'px'
  dragOverTarget.value = null
  document.querySelectorAll('[data-builder-team]').forEach(el => {
    const r = el.getBoundingClientRect()
    if (tc.clientX>=r.left && tc.clientX<=r.right && tc.clientY>=r.top && tc.clientY<=r.bottom && el.dataset.group===dragData.value?.group)
      dragOverTarget.value = `${el.dataset.group}-${el.dataset.index}`
  })
}
function onTouchEnd(event) {
  if (touchClone) { document.body.removeChild(touchClone); touchClone = null }
  if (!touchDragEl.value || !dragData.value) return
  const tc = event.changedTouches[0]; let target = null
  document.querySelectorAll('[data-builder-team]').forEach(el => {
    const r = el.getBoundingClientRect()
    if (tc.clientX>=r.left && tc.clientX<=r.right && tc.clientY>=r.top && tc.clientY<=r.bottom && el.dataset.group===dragData.value?.group) target = el
  })
  if (target) { const f = dragData.value.index, to = parseInt(target.dataset.index); if (f!==to) t.swapBuilderTeams(dragData.value.group, f, to) }
  touchDragEl.value = null; dragData.value = null; dragOverTarget.value = null
}
</script>

<template>
  <div>
    <p class="text-center text-slate-400 text-sm mb-5">
      Grup sıralamaları nasıl olursa eşleşmeler nasıl olur? Takımları sürükleyerek deneyin, altta takıma tıklayarak ilerletin.
    </p>

    <!-- Group Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="g in GROUP_KEYS" :key="g" class="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl overflow-hidden">
        <div class="px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 text-center font-bold tracking-widest text-sm">GRUP {{ g }}</div>
        <div class="p-2 space-y-1.5">
          <div
            v-for="(team, idx) in t.builderOrder[g]" :key="team" draggable="true"
            data-builder-team :data-group="g" :data-index="idx"
            @dragstart="onDragStart(g,idx,$event)" @dragend="onDragEnd"
            @dragover="onDragOver(g,idx,$event)" @dragleave="onDragLeave" @drop="onDrop(g,idx,$event)"
            @touchstart.prevent="onTouchStart(g,idx,$event)" @touchmove="onTouchMove" @touchend="onTouchEnd"
            :class="['flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab select-none transition-all duration-150 border-2',
              dragData?.group===g && dragData?.index===idx ? 'opacity-40 border-emerald-500/40'
              : dragOverTarget===`${g}-${idx}` ? 'border-emerald-500 bg-emerald-500/[0.08] scale-[1.02]'
              : 'border-transparent bg-white/[0.06] hover:bg-white/[0.1]']"
          >
            <span class="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{{ idx+1 }}</span>
            <span class="font-semibold text-sm truncate">{{ team }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Interactive Bracket ═══ -->
    <div class="mt-10">
      <h3 class="text-center text-emerald-400 font-bold text-lg mb-1">Eşleşme Tablosu</h3>
      <p class="text-center text-slate-500 text-xs mb-6">Kazanan takıma tıklayarak bir sonraki tura geçirin</p>

      <div class="overflow-x-auto pb-4">
        <div class="flex items-stretch min-h-[600px] min-w-[1050px]">

          <!-- ════ LEFT ════ -->
          <div class="flex items-stretch flex-1">
            <!-- QF Left -->
            <div class="flex flex-col justify-around min-w-[160px] px-1">
              <template v-for="pairIdx in [0, 1]" :key="pairIdx">
                <div class="flex-1 flex flex-col justify-around relative">
                  <div class="absolute right-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
                  <div v-for="m in qfMatches.slice(pairIdx*2, pairIdx*2+2)" :key="m.id" class="flex-1 flex items-center justify-center p-1">
                    <div class="bg-white/[0.05] rounded-lg border border-white/[0.1] w-full max-w-[155px] overflow-hidden">
                      <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold tracking-wide">{{ m.label }}</div>
                      <div @click="pickWinner(m.id, m.home)" :class="['flex items-center gap-1.5 px-2 py-[6px] border-b border-white/[0.05] text-xs cursor-pointer transition-all hover:bg-white/[0.06]', winners[m.id]===m.home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400' : '', winners[m.id] && winners[m.id]!==m.home ? 'opacity-40' : '']">
                        <span class="text-emerald-500/70 text-[9px] font-bold w-5">{{ m.hTag }}</span>
                        <span class="font-medium truncate flex-1">{{ m.home }}</span>
                        <span v-if="winners[m.id]===m.home" class="text-emerald-400 text-[10px]">✓</span>
                      </div>
                      <div @click="pickWinner(m.id, m.away)" :class="['flex items-center gap-1.5 px-2 py-[6px] text-xs cursor-pointer transition-all hover:bg-white/[0.06]', winners[m.id]===m.away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400' : '', winners[m.id] && winners[m.id]!==m.away ? 'opacity-40' : '']">
                        <span class="text-emerald-500/70 text-[9px] font-bold w-5">{{ m.aTag }}</span>
                        <span class="font-medium truncate flex-1">{{ m.away }}</span>
                        <span v-if="winners[m.id]===m.away" class="text-emerald-400 text-[10px]">✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- SF Left -->
            <div class="flex flex-col justify-around min-w-[150px] px-1 relative">
              <div class="absolute right-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div v-for="sfId in ['sf1','sf2']" :key="sfId" class="flex-1 flex items-center justify-center p-1">
                <div class="bg-white/[0.04] rounded-lg border border-white/[0.08] w-full max-w-[145px] overflow-hidden">
                  <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold">{{ sfId==='sf1'?'Yarı Final 1':'Yarı Final 2' }}</div>
                  <div @click="pickWinner(sfId, getMatchTeams(sfId).home)" :class="['px-2 py-[5px] text-[11px] border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams(sfId).home ? 'text-slate-600 italic pointer-events-none' : '', winners[sfId]===getMatchTeams(sfId).home && getMatchTeams(sfId).home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners[sfId] && winners[sfId]!==getMatchTeams(sfId).home ? 'opacity-40' : '']">
                    {{ getMatchTeams(sfId).home || '—' }}
                    <span v-if="winners[sfId]===getMatchTeams(sfId).home && getMatchTeams(sfId).home" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                  <div @click="pickWinner(sfId, getMatchTeams(sfId).away)" :class="['px-2 py-[5px] text-[11px] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams(sfId).away ? 'text-slate-600 italic pointer-events-none' : '', winners[sfId]===getMatchTeams(sfId).away && getMatchTeams(sfId).away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners[sfId] && winners[sfId]!==getMatchTeams(sfId).away ? 'opacity-40' : '']">
                    {{ getMatchTeams(sfId).away || '—' }}
                    <span v-if="winners[sfId]===getMatchTeams(sfId).away && getMatchTeams(sfId).away" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Left -->
            <div class="flex flex-col justify-center min-w-[140px] px-1">
              <div class="flex items-center justify-center p-1">
                <div class="bg-white/[0.04] rounded-lg border border-white/[0.08] w-full max-w-[135px] overflow-hidden">
                  <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold">Final 1</div>
                  <div @click="pickWinner('f1', getMatchTeams('f1').home)" :class="['px-2 py-[5px] text-[11px] border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('f1').home ? 'text-slate-600 italic pointer-events-none' : '', winners.f1===getMatchTeams('f1').home && getMatchTeams('f1').home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.f1 && winners.f1!==getMatchTeams('f1').home ? 'opacity-40' : '']">
                    {{ getMatchTeams('f1').home || '—' }}
                    <span v-if="winners.f1===getMatchTeams('f1').home && getMatchTeams('f1').home" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                  <div @click="pickWinner('f1', getMatchTeams('f1').away)" :class="['px-2 py-[5px] text-[11px] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('f1').away ? 'text-slate-600 italic pointer-events-none' : '', winners.f1===getMatchTeams('f1').away && getMatchTeams('f1').away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.f1 && winners.f1!==getMatchTeams('f1').away ? 'opacity-40' : '']">
                    {{ getMatchTeams('f1').away || '—' }}
                    <span v-if="winners.f1===getMatchTeams('f1').away && getMatchTeams('f1').away" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════ CENTER ════ -->
          <div class="flex flex-col items-center justify-center min-w-[170px] px-2">
            <div class="text-center p-5 bg-gradient-to-b from-yellow-500/[0.08] to-yellow-500/[0.02] border-2 rounded-2xl min-w-[150px]" :class="champion ? 'border-yellow-400/40' : 'border-yellow-500/20'">
              <div class="text-5xl mb-1">🏆</div>
              <div class="text-[10px] text-slate-400 uppercase tracking-[2px] font-semibold">Şampiyon</div>
              <div :class="['text-lg font-extrabold mt-2 min-h-[1.6em] transition-all', champion ? 'text-yellow-400' : 'text-slate-600']">{{ champion || '?' }}</div>
            </div>
            <div class="mt-3 w-full max-w-[150px]">
              <div class="bg-yellow-500/[0.06] rounded-lg border border-yellow-500/30 overflow-hidden">
                <div class="text-center text-[9px] text-yellow-500/70 py-0.5 bg-black/20 font-semibold">Büyük Final</div>
                <div @click="pickWinner('gf', getMatchTeams('gf').home)" :class="['px-2 py-[5px] text-[11px] border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('gf').home ? 'text-slate-600 italic pointer-events-none' : '', winners.gf===getMatchTeams('gf').home && getMatchTeams('gf').home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.gf && winners.gf!==getMatchTeams('gf').home ? 'opacity-40' : '']">
                  {{ getMatchTeams('gf').home || '—' }}
                  <span v-if="winners.gf===getMatchTeams('gf').home && getMatchTeams('gf').home" class="text-emerald-400 text-[10px] float-right">✓</span>
                </div>
                <div @click="pickWinner('gf', getMatchTeams('gf').away)" :class="['px-2 py-[5px] text-[11px] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('gf').away ? 'text-slate-600 italic pointer-events-none' : '', winners.gf===getMatchTeams('gf').away && getMatchTeams('gf').away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.gf && winners.gf!==getMatchTeams('gf').away ? 'opacity-40' : '']">
                  {{ getMatchTeams('gf').away || '—' }}
                  <span v-if="winners.gf===getMatchTeams('gf').away && getMatchTeams('gf').away" class="text-emerald-400 text-[10px] float-right">✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ════ RIGHT ════ -->
          <div class="flex items-stretch flex-1">
            <!-- Final Right -->
            <div class="flex flex-col justify-center min-w-[140px] px-1">
              <div class="flex items-center justify-center p-1">
                <div class="bg-white/[0.04] rounded-lg border border-white/[0.08] w-full max-w-[135px] overflow-hidden">
                  <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold">Final 2</div>
                  <div @click="pickWinner('f2', getMatchTeams('f2').home)" :class="['px-2 py-[5px] text-[11px] border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('f2').home ? 'text-slate-600 italic pointer-events-none' : '', winners.f2===getMatchTeams('f2').home && getMatchTeams('f2').home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.f2 && winners.f2!==getMatchTeams('f2').home ? 'opacity-40' : '']">
                    {{ getMatchTeams('f2').home || '—' }}
                    <span v-if="winners.f2===getMatchTeams('f2').home && getMatchTeams('f2').home" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                  <div @click="pickWinner('f2', getMatchTeams('f2').away)" :class="['px-2 py-[5px] text-[11px] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams('f2').away ? 'text-slate-600 italic pointer-events-none' : '', winners.f2===getMatchTeams('f2').away && getMatchTeams('f2').away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners.f2 && winners.f2!==getMatchTeams('f2').away ? 'opacity-40' : '']">
                    {{ getMatchTeams('f2').away || '—' }}
                    <span v-if="winners.f2===getMatchTeams('f2').away && getMatchTeams('f2').away" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SF Right -->
            <div class="flex flex-col justify-around min-w-[150px] px-1 relative">
              <div class="absolute left-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div v-for="sfId in ['sf3','sf4']" :key="sfId" class="flex-1 flex items-center justify-center p-1">
                <div class="bg-white/[0.04] rounded-lg border border-white/[0.08] w-full max-w-[145px] overflow-hidden">
                  <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold">{{ sfId==='sf3'?'Yarı Final 3':'Yarı Final 4' }}</div>
                  <div @click="pickWinner(sfId, getMatchTeams(sfId).home)" :class="['px-2 py-[5px] text-[11px] border-b border-white/[0.05] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams(sfId).home ? 'text-slate-600 italic pointer-events-none' : '', winners[sfId]===getMatchTeams(sfId).home && getMatchTeams(sfId).home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners[sfId] && winners[sfId]!==getMatchTeams(sfId).home ? 'opacity-40' : '']">
                    {{ getMatchTeams(sfId).home || '—' }}
                    <span v-if="winners[sfId]===getMatchTeams(sfId).home && getMatchTeams(sfId).home" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                  <div @click="pickWinner(sfId, getMatchTeams(sfId).away)" :class="['px-2 py-[5px] text-[11px] cursor-pointer transition-all hover:bg-white/[0.06]', !getMatchTeams(sfId).away ? 'text-slate-600 italic pointer-events-none' : '', winners[sfId]===getMatchTeams(sfId).away && getMatchTeams(sfId).away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400 font-semibold text-emerald-400' : '', winners[sfId] && winners[sfId]!==getMatchTeams(sfId).away ? 'opacity-40' : '']">
                    {{ getMatchTeams(sfId).away || '—' }}
                    <span v-if="winners[sfId]===getMatchTeams(sfId).away && getMatchTeams(sfId).away" class="text-emerald-400 text-[10px] float-right">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- QF Right -->
            <div class="flex flex-col justify-around min-w-[160px] px-1">
              <template v-for="pairIdx in [0, 1]" :key="pairIdx">
                <div class="flex-1 flex flex-col justify-around relative">
                  <div class="absolute left-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
                  <div v-for="m in qfMatches.slice(4 + pairIdx*2, 4 + pairIdx*2+2)" :key="m.id" class="flex-1 flex items-center justify-center p-1">
                    <div class="bg-white/[0.05] rounded-lg border border-white/[0.1] w-full max-w-[155px] overflow-hidden">
                      <div class="text-center text-[9px] text-slate-500 py-0.5 bg-black/20 font-semibold tracking-wide">{{ m.label }}</div>
                      <div @click="pickWinner(m.id, m.home)" :class="['flex items-center gap-1.5 px-2 py-[6px] border-b border-white/[0.05] text-xs cursor-pointer transition-all hover:bg-white/[0.06]', winners[m.id]===m.home ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400' : '', winners[m.id] && winners[m.id]!==m.home ? 'opacity-40' : '']">
                        <span class="text-emerald-500/70 text-[9px] font-bold w-5">{{ m.hTag }}</span>
                        <span class="font-medium truncate flex-1">{{ m.home }}</span>
                        <span v-if="winners[m.id]===m.home" class="text-emerald-400 text-[10px]">✓</span>
                      </div>
                      <div @click="pickWinner(m.id, m.away)" :class="['flex items-center gap-1.5 px-2 py-[6px] text-xs cursor-pointer transition-all hover:bg-white/[0.06]', winners[m.id]===m.away ? 'bg-emerald-500/20 border-l-2 border-l-emerald-400' : '', winners[m.id] && winners[m.id]!==m.away ? 'opacity-40' : '']">
                        <span class="text-emerald-500/70 text-[9px] font-bold w-5">{{ m.aTag }}</span>
                        <span class="font-medium truncate flex-1">{{ m.away }}</span>
                        <span v-if="winners[m.id]===m.away" class="text-emerald-400 text-[10px]">✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
