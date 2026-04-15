<script setup>
import { inject, computed } from 'vue'
import BracketMatch from './BracketMatch.vue'

const t = inject('tournament')

const champion = computed(() => t.getChampion())
</script>

<template>
  <div>
    <!-- Actions -->
    <div class="flex justify-center gap-2 mb-6 flex-wrap">
      <button
        @click="t.simulateAllKO()"
        class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Tümünü Simüle Et
      </button>
      <button
        @click="t.simulateKORound('qf')"
        class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-xs font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Çeyrek Final
      </button>
      <button
        @click="t.simulateKORound('sf')"
        class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-xs font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Yarı Final
      </button>
      <button
        @click="t.simulateKORound('f')"
        class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-xs font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Final
      </button>
      <button
        @click="t.simulateKORound('gf')"
        class="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg text-xs font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Büyük Final
      </button>
      <button
        @click="t.resetAllKO()"
        class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg text-xs font-semibold hover:shadow-lg transition-all active:scale-95"
      >
        Sıfırla
      </button>
    </div>

    <!-- Bracket -->
    <div class="overflow-x-auto pb-4">
      <div class="flex items-stretch min-h-[660px] min-w-[1100px]">
        <!-- ════ LEFT SIDE ════ -->
        <div class="flex items-stretch flex-1">
          <!-- QF Left -->
          <div class="flex flex-col justify-around min-w-[168px] px-1">
            <!-- Pair 1 -->
            <div class="flex-1 flex flex-col justify-around relative">
              <div class="absolute right-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf1" label="A1 vs B4" />
              </div>
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf2" label="C2 vs D3" />
              </div>
            </div>
            <!-- Pair 2 -->
            <div class="flex-1 flex flex-col justify-around relative">
              <div class="absolute right-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf3" label="B1 vs A4" />
              </div>
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf4" label="D2 vs C3" />
              </div>
            </div>
          </div>

          <!-- SF Left -->
          <div class="flex flex-col justify-around min-w-[168px] px-1 relative">
            <div class="absolute right-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="sf1" label="Yarı Final 1" />
            </div>
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="sf2" label="Yarı Final 2" />
            </div>
          </div>

          <!-- Final Left -->
          <div class="flex flex-col justify-around min-w-[168px] px-1">
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="f1" label="Final 1" />
            </div>
          </div>
        </div>

        <!-- ════ CENTER ════ -->
        <div class="flex items-center justify-center min-w-[200px] px-3">
          <div>
            <!-- Champion -->
            <div
              class="text-center p-6 bg-gradient-to-b from-yellow-500/[0.08] to-yellow-500/[0.02] border-2 border-yellow-500/25 rounded-2xl min-w-[180px]"
            >
              <div class="text-5xl mb-2">🏆</div>
              <div class="text-[11px] text-slate-400 uppercase tracking-[3px] font-semibold">
                Şampiyon
              </div>
              <div
                :class="[
                  'text-lg font-extrabold mt-2 min-h-[1.6em] transition-all',
                  champion ? 'text-yellow-400' : 'text-slate-600',
                ]"
              >
                {{ champion || '?' }}
              </div>
            </div>

            <!-- Grand Final Match -->
            <div class="mt-4 flex justify-center">
              <BracketMatch id="gf" label="Büyük Final" :is-champion-match="true" />
            </div>
          </div>
        </div>

        <!-- ════ RIGHT SIDE ════ -->
        <div class="flex items-stretch flex-1">
          <!-- Final Right -->
          <div class="flex flex-col justify-around min-w-[168px] px-1">
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="f2" label="Final 2" />
            </div>
          </div>

          <!-- SF Right -->
          <div class="flex flex-col justify-around min-w-[168px] px-1 relative">
            <div class="absolute left-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="sf3" label="Yarı Final 3" />
            </div>
            <div class="flex-1 flex items-center justify-center p-1">
              <BracketMatch id="sf4" label="Yarı Final 4" />
            </div>
          </div>

          <!-- QF Right -->
          <div class="flex flex-col justify-around min-w-[168px] px-1">
            <!-- Pair 1 -->
            <div class="flex-1 flex flex-col justify-around relative">
              <div class="absolute left-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf5" label="C1 vs D4" />
              </div>
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf6" label="A2 vs B3" />
              </div>
            </div>
            <!-- Pair 2 -->
            <div class="flex-1 flex flex-col justify-around relative">
              <div class="absolute left-0 top-[25%] h-[50%] w-[2px] bg-emerald-500/20 rounded-full" />
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf7" label="D1 vs C4" />
              </div>
              <div class="flex-1 flex items-center justify-center p-1">
                <BracketMatch id="qf8" label="B2 vs A3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
