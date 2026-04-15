<script setup>
import { inject, computed } from 'vue'
import {
  GROUPS,
  GROUP_KEYS,
  WEEK_LABELS,
  WEEK_TO_KO,
  KO_ROUND_IDS,
  KO_LABELS,
} from '../tournament.js'

const t = inject('tournament')

const isGroupWeek = computed(() => t.currentWeek.value < 3)
const koRound = computed(() => WEEK_TO_KO[t.currentWeek.value])
const koMatchIds = computed(() =>
  koRound.value ? KO_ROUND_IDS[koRound.value] : []
)

function simulateCurrentWeek() {
  if (isGroupWeek.value) t.simulateGroupWeek(t.currentWeek.value)
  else t.simulateKOWeek(t.currentWeek.value)
}

function resetCurrentWeek() {
  if (isGroupWeek.value) t.resetGroupWeek(t.currentWeek.value)
  else t.resetKOWeek(t.currentWeek.value)
}

function isKOWinner(id, side) {
  const m = t.koMatches[id]
  if (m.hs === null || m.as === null) return false
  if (side === 'home')
    return m.hs > m.as || (m.hs === m.as && m.penWinner === 'home')
  return m.as > m.hs || (m.hs === m.as && m.penWinner === 'away')
}

function isKOPenalty(id) {
  const m = t.koMatches[id]
  return m.hs !== null && m.as !== null && m.hs === m.as
}

// Layout helper for KO grid columns
const koGridCols = computed(() => {
  const len = koMatchIds.value.length
  if (len <= 1) return 'max-w-md mx-auto'
  if (len <= 2) return 'max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2'
  if (len <= 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
})
</script>

<template>
  <div>
    <!-- Week Navigation -->
    <div class="flex items-center justify-center gap-2 mb-6 flex-wrap">
      <button
        v-for="(label, idx) in WEEK_LABELS"
        :key="idx"
        @click="t.currentWeek.value = idx"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative',
          t.currentWeek.value === idx
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 scale-105'
            : t.isWeekComplete(idx)
              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20'
              : t.isWeekPartial(idx)
                ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20'
                : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] border border-white/[0.06]',
        ]"
      >
        {{ label }}
        <span
          v-if="t.isWeekComplete(idx) && t.currentWeek.value !== idx"
          class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0f2240]"
        />
      </button>
    </div>

    <!-- Actions -->
    <div class="flex justify-center gap-3 mb-6 flex-wrap">
      <button
        @click="simulateCurrentWeek"
        class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
      >
        Haftayı Simüle Et
      </button>
      <button
        @click="isGroupWeek ? t.simulateAllGroups() : t.simulateAllKO()"
        class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
      >
        {{ isGroupWeek ? 'Tüm Grupları Simüle Et' : 'Tüm Elemeyi Simüle Et' }}
      </button>
      <button
        @click="resetCurrentWeek"
        class="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
      >
        Sıfırla
      </button>
    </div>

    <!-- ─── Group Stage Week ─── -->
    <div v-if="isGroupWeek" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="g in GROUP_KEYS"
        :key="g"
        class="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl overflow-hidden"
      >
        <!-- Group Header -->
        <div
          class="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-center font-bold tracking-widest text-sm"
        >
          GRUP {{ g }}
        </div>

        <!-- Matches -->
        <div class="p-4 space-y-3">
          <div
            v-for="(match, mIdx) in t.groupMatches[g][t.currentWeek.value]"
            :key="mIdx"
            :class="[
              'flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200',
              match.hs !== null && match.as !== null
                ? 'bg-emerald-500/[0.08] border border-emerald-500/20'
                : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06]',
            ]"
          >
            <!-- Home Team -->
            <span
              :class="[
                'flex-1 text-right text-sm font-medium truncate',
                match.hs !== null && match.as !== null && match.hs > match.as
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-200',
              ]"
            >
              {{ GROUPS[g][match.home] }}
            </span>

            <!-- Score Inputs -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <input
                type="number"
                min="0"
                :value="match.hs !== null ? match.hs : ''"
                @change="
                  t.setGroupScore(
                    g,
                    t.currentWeek.value,
                    mIdx,
                    'h',
                    $event.target.value
                  )
                "
                class="w-10 h-8 text-center bg-white/[0.08] border border-white/[0.12] rounded-lg text-white font-bold text-sm focus:border-emerald-500 focus:outline-none focus:bg-emerald-500/[0.12] focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              <span class="text-slate-600 font-bold text-xs">—</span>
              <input
                type="number"
                min="0"
                :value="match.as !== null ? match.as : ''"
                @change="
                  t.setGroupScore(
                    g,
                    t.currentWeek.value,
                    mIdx,
                    'a',
                    $event.target.value
                  )
                "
                class="w-10 h-8 text-center bg-white/[0.08] border border-white/[0.12] rounded-lg text-white font-bold text-sm focus:border-emerald-500 focus:outline-none focus:bg-emerald-500/[0.12] focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <!-- Away Team -->
            <span
              :class="[
                'flex-1 text-sm font-medium truncate',
                match.hs !== null && match.as !== null && match.as > match.hs
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-200',
              ]"
            >
              {{ GROUPS[g][match.away] }}
            </span>

            <!-- Simulate Button -->
            <button
              v-if="match.hs === null || match.as === null"
              @click="
                t.simulateGroupMatch(g, t.currentWeek.value, mIdx)
              "
              class="w-8 h-8 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 active:scale-90 transition-all text-xs flex-shrink-0"
            >
              ▶
            </button>
            <div v-else class="w-8 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Knockout Week ─── -->
    <div v-else>
      <div :class="['gap-5', koGridCols]">
        <div
          v-for="id in koMatchIds"
          :key="id"
          class="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl overflow-hidden"
        >
          <!-- Match Label -->
          <div
            class="text-center text-xs text-slate-500 py-2 bg-black/20 font-semibold tracking-wide"
          >
            {{ KO_LABELS[id] }}
          </div>

          <!-- Home -->
          <div
            :class="[
              'flex items-center justify-between px-4 py-3 border-b border-white/[0.05] transition-colors',
              isKOWinner(id, 'home') ? 'bg-emerald-500/[0.12]' : '',
            ]"
          >
            <span
              :class="[
                'text-sm font-medium flex-1 truncate',
                !t.koMatches[id].homeTeam ? 'text-slate-600 italic' : '',
                isKOWinner(id, 'home') ? 'text-emerald-400 font-bold' : '',
              ]"
            >
              {{ t.koMatches[id].homeTeam || 'TBD' }}
            </span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="0"
                :value="t.koMatches[id].hs !== null ? t.koMatches[id].hs : ''"
                @change="t.setKOScore(id, 'h', $event.target.value)"
                :disabled="
                  !t.koMatches[id].homeTeam || !t.koMatches[id].awayTeam
                "
                class="w-10 h-8 text-center bg-white/[0.08] border border-white/[0.1] rounded-lg text-white font-bold text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-30 transition-all"
              />
              <span
                v-if="isKOWinner(id, 'home') && isKOPenalty(id)"
                class="text-amber-400 text-xs font-semibold"
              >(p)</span>
            </div>
          </div>

          <!-- Away -->
          <div
            :class="[
              'flex items-center justify-between px-4 py-3 transition-colors',
              isKOWinner(id, 'away') ? 'bg-emerald-500/[0.12]' : '',
            ]"
          >
            <span
              :class="[
                'text-sm font-medium flex-1 truncate',
                !t.koMatches[id].awayTeam ? 'text-slate-600 italic' : '',
                isKOWinner(id, 'away') ? 'text-emerald-400 font-bold' : '',
              ]"
            >
              {{ t.koMatches[id].awayTeam || 'TBD' }}
            </span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                min="0"
                :value="t.koMatches[id].as !== null ? t.koMatches[id].as : ''"
                @change="t.setKOScore(id, 'a', $event.target.value)"
                :disabled="
                  !t.koMatches[id].homeTeam || !t.koMatches[id].awayTeam
                "
                class="w-10 h-8 text-center bg-white/[0.08] border border-white/[0.1] rounded-lg text-white font-bold text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-30 transition-all"
              />
              <span
                v-if="isKOWinner(id, 'away') && isKOPenalty(id)"
                class="text-amber-400 text-xs font-semibold"
              >(p)</span>
            </div>
          </div>

          <!-- Simulate -->
          <button
            @click="t.simulateKOMatch(id)"
            class="w-full py-2 bg-emerald-500/[0.12] text-emerald-400 text-xs font-semibold hover:bg-emerald-500/[0.22] transition-colors"
          >
            Simüle Et
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
