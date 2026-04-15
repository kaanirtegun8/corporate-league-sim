<script setup>
import { provide } from 'vue'
import { useTournament } from './tournament.js'
import FixtureView from './components/FixtureView.vue'
import StandingsView from './components/StandingsView.vue'
import BracketView from './components/BracketView.vue'
import BuilderView from './components/BuilderView.vue'

const tournament = useTournament()
provide('tournament', tournament)

const tabs = [
  { id: 'fixture', label: 'Fikstür' },
  { id: 'standings', label: 'Puan Durumu' },
  { id: 'bracket', label: 'Eşleşme Tablosu' },
  { id: 'builder', label: 'Grup Hazırlama' },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a3a6c] to-[#0a1628] text-white">
    <!-- Header -->
    <header class="bg-black/30 backdrop-blur border-b border-white/10 py-5 px-5 text-center">
      <h1
        class="text-2xl md:text-3xl font-extrabold tracking-widest bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent"
      >
        ŞİRKETLER HALI SAHA LİGİ
      </h1>
      <p class="text-slate-400 text-sm mt-1">Turnuva Simülasyonu</p>
    </header>

    <!-- Tabs -->
    <nav class="flex justify-center gap-2 p-3 bg-black/20 backdrop-blur-sm flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="tournament.activeTab.value = tab.id"
        :class="[
          'px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
          tournament.activeTab.value === tab.id
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25'
            : 'bg-white/[0.07] text-slate-400 hover:bg-white/[0.12] hover:text-slate-200',
        ]"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Content -->
    <main class="max-w-[1440px] mx-auto p-4 md:p-6">
      <FixtureView v-if="tournament.activeTab.value === 'fixture'" />
      <StandingsView v-if="tournament.activeTab.value === 'standings'" />
      <BracketView v-if="tournament.activeTab.value === 'bracket'" />
      <BuilderView v-if="tournament.activeTab.value === 'builder'" />
    </main>

    <!-- Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="tournament.toastVisible.value"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 bg-emerald-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-2xl shadow-emerald-500/30 z-50"
      >
        {{ tournament.toastMessage.value }}
      </div>
    </Transition>
  </div>
</template>
