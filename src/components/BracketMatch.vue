<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  id: String,
  label: String,
  isChampionMatch: Boolean,
})

const t = inject('tournament')

const match = computed(() => t.koMatches[props.id])
const played = computed(
  () => match.value.hs !== null && match.value.as !== null
)
const pen = computed(() => played.value && match.value.hs === match.value.as)

function isWinner(side) {
  if (!played.value) return false
  const m = match.value
  if (side === 'home')
    return m.hs > m.as || (m.hs === m.as && m.penWinner === 'home')
  return m.as > m.hs || (m.hs === m.as && m.penWinner === 'away')
}
</script>

<template>
  <div
    :class="[
      'rounded-lg border overflow-hidden w-full max-w-[162px] transition-all duration-200',
      isChampionMatch
        ? 'border-yellow-500/30 bg-yellow-500/[0.06]'
        : 'bg-white/[0.05] border-white/[0.1] hover:border-emerald-500/30',
    ]"
  >
    <!-- Label -->
    <div class="text-center text-[10px] text-slate-500 py-0.5 bg-black/20 font-semibold tracking-wide">
      {{ label }}
    </div>

    <!-- Home -->
    <div
      :class="[
        'flex items-center justify-between px-2 py-[5px] border-b border-white/[0.05] text-xs transition-colors',
        isWinner('home') ? 'bg-emerald-500/[0.15]' : '',
      ]"
    >
      <span
        :class="[
          'flex-1 font-medium truncate pr-1',
          !match.homeTeam ? 'text-slate-600 italic' : '',
          isWinner('home') ? 'text-emerald-400 font-bold' : '',
        ]"
      >
        {{ match.homeTeam || 'TBD' }}
      </span>
      <input
        type="number"
        min="0"
        :value="match.hs ?? ''"
        @change="t.setKOScore(id, 'h', $event.target.value)"
        :disabled="!match.homeTeam || !match.awayTeam"
        class="w-7 h-[22px] text-center bg-white/[0.08] border border-white/[0.1] rounded text-white font-bold text-[11px] focus:border-emerald-500 focus:outline-none disabled:opacity-30 transition-all"
      />
      <span
        v-if="isWinner('home') && pen"
        class="text-amber-400 text-[9px] ml-0.5 font-bold"
      >(p)</span>
    </div>

    <!-- Away -->
    <div
      :class="[
        'flex items-center justify-between px-2 py-[5px] text-xs transition-colors',
        isWinner('away') ? 'bg-emerald-500/[0.15]' : '',
      ]"
    >
      <span
        :class="[
          'flex-1 font-medium truncate pr-1',
          !match.awayTeam ? 'text-slate-600 italic' : '',
          isWinner('away') ? 'text-emerald-400 font-bold' : '',
        ]"
      >
        {{ match.awayTeam || 'TBD' }}
      </span>
      <input
        type="number"
        min="0"
        :value="match.as ?? ''"
        @change="t.setKOScore(id, 'a', $event.target.value)"
        :disabled="!match.homeTeam || !match.awayTeam"
        class="w-7 h-[22px] text-center bg-white/[0.08] border border-white/[0.1] rounded text-white font-bold text-[11px] focus:border-emerald-500 focus:outline-none disabled:opacity-30 transition-all"
      />
      <span
        v-if="isWinner('away') && pen"
        class="text-amber-400 text-[9px] ml-0.5 font-bold"
      >(p)</span>
    </div>

    <!-- Simulate -->
    <button
      @click="t.simulateKOMatch(id)"
      class="w-full py-[3px] bg-emerald-500/[0.12] text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/[0.22] transition-colors"
    >
      Simüle Et
    </button>
  </div>
</template>
