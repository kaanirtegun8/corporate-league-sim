<script setup>
import { inject } from 'vue'
import { GROUP_KEYS } from '../tournament.js'

const t = inject('tournament')
</script>

<template>
  <div>
    <!-- Actions -->
    <div class="flex justify-center gap-3 mb-6 flex-wrap">
      <button
        @click="t.simulateAllGroups()"
        class="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
      >
        Tümünü Simüle Et
      </button>
      <button
        @click="t.resetAllGroups()"
        class="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
      >
        Sıfırla
      </button>
    </div>

    <!-- Group Tables -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="g in GROUP_KEYS"
        :key="g"
        class="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl overflow-hidden"
      >
        <div
          class="px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-center font-bold tracking-widest text-sm"
        >
          GRUP {{ g }}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[11px] text-slate-500 uppercase border-b border-white/[0.08]">
                <th class="py-2.5 px-2 text-center w-8">#</th>
                <th class="py-2.5 px-2 text-left">Takım</th>
                <th class="py-2.5 px-1.5 text-center">O</th>
                <th class="py-2.5 px-1.5 text-center">G</th>
                <th class="py-2.5 px-1.5 text-center">B</th>
                <th class="py-2.5 px-1.5 text-center">M</th>
                <th class="py-2.5 px-1.5 text-center">AG</th>
                <th class="py-2.5 px-1.5 text-center">YG</th>
                <th class="py-2.5 px-1.5 text-center">AV</th>
                <th class="py-2.5 px-2 text-center">P</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, idx) in t.calcStandings(g)"
                :key="team.idx"
                class="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                <td class="py-2.5 px-2 text-center">
                  <span
                    :class="[
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                      idx === 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : idx === 1
                          ? 'bg-emerald-500/10 text-emerald-500/70'
                          : 'text-slate-500',
                    ]"
                  >
                    {{ idx + 1 }}
                  </span>
                </td>
                <td
                  class="py-2.5 px-2 text-left font-semibold truncate max-w-[140px]"
                  :title="team.name"
                >
                  {{ team.name }}
                </td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.p }}</td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.w }}</td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.d }}</td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.l }}</td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.gf }}</td>
                <td class="py-2.5 px-1.5 text-center text-slate-300">{{ team.ga }}</td>
                <td
                  class="py-2.5 px-1.5 text-center font-medium"
                  :class="
                    team.gd > 0
                      ? 'text-emerald-400'
                      : team.gd < 0
                        ? 'text-red-400'
                        : 'text-slate-500'
                  "
                >
                  {{ team.gd > 0 ? '+' : '' }}{{ team.gd }}
                </td>
                <td class="py-2.5 px-2 text-center text-emerald-400 font-bold text-base">
                  {{ team.pts }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
