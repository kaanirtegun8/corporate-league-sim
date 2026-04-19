import { reactive, ref, computed } from 'vue'

export const GROUPS = {
  A: ['Turkcell', 'Happy Moons', 'Fellas', 'ATR YAPI'],
  B: ['Siemens', 'Otokoç', 'Dinçer Lojistik', 'Aslı Partners'],
  C: ['Garanti BBVA', 'Socar Türkiye', 'Scorp', 'Odeabank'],
  D: ['Smart Mind', 'TEB', 'Shell', 'Kalitegaz'],
}

export const GROUP_KEYS = ['A', 'B', 'C', 'D']

// Round-robin schedule for 4 teams (indices into GROUPS[x])
// Each sub-array is one week, containing [home, away] pairs
export const WEEK_SCHEDULE = [
  [[0, 3], [1, 2]], // 1. Hafta
  [[0, 2], [1, 3]], // 2. Hafta
  [[0, 1], [2, 3]], // 3. Hafta
]

export const WEEK_LABELS = [
  '1. Hafta',
  '2. Hafta',
  '3. Hafta',
  'Çeyrek Final',
  'Yarı Final',
  'Final',
  'Büyük Final',
]

export const QF_TEMPLATE = [
  { id: 'qf1', home: ['A', 0], away: ['B', 3] },
  { id: 'qf2', home: ['C', 1], away: ['D', 2] },
  { id: 'qf3', home: ['B', 0], away: ['A', 3] },
  { id: 'qf4', home: ['D', 1], away: ['C', 2] },
  { id: 'qf5', home: ['C', 0], away: ['D', 3] },
  { id: 'qf6', home: ['A', 1], away: ['B', 2] },
  { id: 'qf7', home: ['D', 0], away: ['C', 3] },
  { id: 'qf8', home: ['B', 1], away: ['A', 2] },
]

export const ADVANCEMENT = {
  qf1: { next: 'sf1', pos: 'home' },
  qf2: { next: 'sf1', pos: 'away' },
  qf3: { next: 'sf2', pos: 'home' },
  qf4: { next: 'sf2', pos: 'away' },
  qf5: { next: 'sf3', pos: 'home' },
  qf6: { next: 'sf3', pos: 'away' },
  qf7: { next: 'sf4', pos: 'home' },
  qf8: { next: 'sf4', pos: 'away' },
  sf1: { next: 'f1', pos: 'home' },
  sf2: { next: 'f1', pos: 'away' },
  sf3: { next: 'f2', pos: 'home' },
  sf4: { next: 'f2', pos: 'away' },
  f1: { next: 'gf', pos: 'home' },
  f2: { next: 'gf', pos: 'away' },
}

export const KO_ROUND_IDS = {
  qf: ['qf1', 'qf2', 'qf3', 'qf4', 'qf5', 'qf6', 'qf7', 'qf8'],
  sf: ['sf1', 'sf2', 'sf3', 'sf4'],
  f: ['f1', 'f2'],
  gf: ['gf'],
}

export const ALL_KO_IDS = [
  ...KO_ROUND_IDS.qf,
  ...KO_ROUND_IDS.sf,
  ...KO_ROUND_IDS.f,
  ...KO_ROUND_IDS.gf,
]

export const WEEK_TO_KO = { 3: 'qf', 4: 'sf', 5: 'f', 6: 'gf' }

export const KO_LABELS = {
  qf1: 'A1 vs B4',
  qf2: 'C2 vs D3',
  qf3: 'B1 vs A4',
  qf4: 'D2 vs C3',
  qf5: 'C1 vs D4',
  qf6: 'A2 vs B3',
  qf7: 'D1 vs C4',
  qf8: 'B2 vs A3',
  sf1: 'Yarı Final 1',
  sf2: 'Yarı Final 2',
  sf3: 'Yarı Final 3',
  sf4: 'Yarı Final 4',
  f1: 'Final 1',
  f2: 'Final 2',
  gf: 'Büyük Final',
}

// ── Composable ──────────────────────────────────────────

export function useTournament() {
  const currentWeek = ref(0)
  const activeTab = ref('fixture')
  const toastMessage = ref('')
  const toastVisible = ref(false)

  // groupMatches[group][weekIndex] = [{ home, away, hs, as }, ...]
  const groupMatches = reactive({})
  const koMatches = reactive({})
  const builderOrder = reactive({})

  // ── Init ──

  function init() {
    GROUP_KEYS.forEach((g) => {
      groupMatches[g] = WEEK_SCHEDULE.map((week) =>
        week.map(([h, a]) => ({ home: h, away: a, hs: null, as: null }))
      )
      builderOrder[g] = [...GROUPS[g]]
    })
    // 1. Hafta sonuçları (18 Nisan 2026)
    groupMatches.A[0][0].hs = 4; groupMatches.A[0][0].as = 0 // Turkcell 4-0 ATR YAPI
    groupMatches.A[0][1].hs = 5; groupMatches.A[0][1].as = 1 // Happy Moons 5-1 Fellas
    groupMatches.B[0][0].hs = 19; groupMatches.B[0][0].as = 1 // Siemens 19-1 Aslı Partners
    groupMatches.B[0][1].hs = 2; groupMatches.B[0][1].as = 3 // Otokoç 2-3 Dinçer Lojistik
    groupMatches.C[0][0].hs = 4; groupMatches.C[0][0].as = 0 // Garanti BBVA 4-0 Odeabank
    groupMatches.C[0][1].hs = 0; groupMatches.C[0][1].as = 4 // Socar Türkiye 0-4 Scorp
    groupMatches.D[0][0].hs = 6; groupMatches.D[0][0].as = 0 // Smart Mind 6-0 Kalitegaz
    groupMatches.D[0][1].hs = 4; groupMatches.D[0][1].as = 1 // TEB 4-1 Shell
    ALL_KO_IDS.forEach((id) => {
      koMatches[id] = {
        homeTeam: null,
        awayTeam: null,
        hs: null,
        as: null,
        penWinner: null,
      }
    })
    populateKOFromGroups()
  }

  // ── Utilities ──

  function showToast(msg) {
    toastMessage.value = msg
    toastVisible.value = true
    setTimeout(() => {
      toastVisible.value = false
    }, 2000)
  }

  function randGoals() {
    const r = Math.random()
    if (r < 0.15) return 0
    if (r < 0.4) return 1
    if (r < 0.6) return 2
    if (r < 0.78) return 3
    if (r < 0.9) return 4
    if (r < 0.96) return 5
    return 6
  }

  // ── Standings ──

  function calcStandings(g) {
    const teams = GROUPS[g]
    const s = teams.map((name, i) => ({
      idx: i,
      name,
      p: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    }))
    groupMatches[g].forEach((weekMatches) => {
      weekMatches.forEach((m) => {
        if (m.hs !== null && m.as !== null) {
          const h = s[m.home]
          const a = s[m.away]
          h.p++
          a.p++
          h.gf += m.hs
          h.ga += m.as
          a.gf += m.as
          a.ga += m.hs
          if (m.hs > m.as) {
            h.w++
            h.pts += 3
            a.l++
          } else if (m.hs < m.as) {
            a.w++
            a.pts += 3
            h.l++
          } else {
            h.d++
            a.d++
            h.pts++
            a.pts++
          }
        }
      })
    })
    s.forEach((x) => (x.gd = x.gf - x.ga))
    s.sort((a, b) => {
      const diff = b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
      if (diff !== 0) return diff
      // Grup C özel tiebreaker: eşitlikte Scorp öncelikli
      if (g === 'C') {
        if (a.name === 'Scorp') return -1
        if (b.name === 'Scorp') return 1
      }
      return 0
    })
    return s
  }

  function getTeamByRank(g, rank) {
    const st = calcStandings(g)
    return st[rank] ? st[rank].name : g + (rank + 1)
  }

  // ── Knockout helpers ──

  function populateKOFromGroups() {
    QF_TEMPLATE.forEach((qt) => {
      const m = koMatches[qt.id]
      m.homeTeam = getTeamByRank(qt.home[0], qt.home[1])
      m.awayTeam = getTeamByRank(qt.away[0], qt.away[1])
    })
    ALL_KO_IDS.forEach((id) => {
      if (koMatches[id].hs !== null && koMatches[id].as !== null) {
        advanceWinner(id)
      }
    })
  }

  function getKOWinner(id) {
    const m = koMatches[id]
    if (m.hs === null || m.as === null) return null
    if (m.hs > m.as) return m.homeTeam
    if (m.as > m.hs) return m.awayTeam
    return m.penWinner === 'home' ? m.homeTeam : m.awayTeam
  }

  function advanceWinner(id) {
    const adv = ADVANCEMENT[id]
    if (!adv) return
    const winner = getKOWinner(id)
    const next = koMatches[adv.next]
    if (adv.pos === 'home') next.homeTeam = winner
    else next.awayTeam = winner
  }

  function clearFromMatch(id) {
    const m = koMatches[id]
    m.hs = null
    m.as = null
    m.penWinner = null
    const adv = ADVANCEMENT[id]
    if (adv) {
      const next = koMatches[adv.next]
      if (adv.pos === 'home') next.homeTeam = null
      else next.awayTeam = null
      clearFromMatch(adv.next)
    }
  }

  // ── Group actions ──

  function simulateGroupMatch(g, weekIdx, matchIdx) {
    const m = groupMatches[g][weekIdx][matchIdx]
    m.hs = randGoals()
    m.as = randGoals()
    populateKOFromGroups()
  }

  function simulateGroupWeek(weekIdx) {
    GROUP_KEYS.forEach((g) => {
      groupMatches[g][weekIdx].forEach((m) => {
        if (m.hs === null) {
          m.hs = randGoals()
          m.as = randGoals()
        }
      })
    })
    populateKOFromGroups()
    showToast(`${WEEK_LABELS[weekIdx]} simüle edildi!`)
  }

  function simulateAllGroups() {
    GROUP_KEYS.forEach((g) => {
      groupMatches[g].forEach((week) => {
        week.forEach((m) => {
          m.hs = randGoals()
          m.as = randGoals()
        })
      })
    })
    populateKOFromGroups()
    showToast('Tüm grup maçları simüle edildi!')
  }

  function resetGroupWeek(weekIdx) {
    GROUP_KEYS.forEach((g) => {
      groupMatches[g][weekIdx].forEach((m) => {
        m.hs = null
        m.as = null
      })
    })
    populateKOFromGroups()
  }

  function resetAllGroups() {
    GROUP_KEYS.forEach((g) => {
      groupMatches[g].forEach((week) => {
        week.forEach((m) => {
          m.hs = null
          m.as = null
        })
      })
    })
    populateKOFromGroups()
    showToast('Grup maçları sıfırlandı')
  }

  function setGroupScore(g, weekIdx, matchIdx, side, val) {
    const m = groupMatches[g][weekIdx][matchIdx]
    const v = val === '' ? null : parseInt(val)
    if (v !== null && (isNaN(v) || v < 0)) return
    if (side === 'h') m.hs = v
    else m.as = v
    populateKOFromGroups()
  }

  // ── Knockout actions ──

  function simulateKOMatch(id) {
    const m = koMatches[id]
    if (!m.homeTeam || !m.awayTeam) {
      showToast('Takımlar belli değil!')
      return
    }
    let hs = randGoals()
    let as = randGoals()
    if (hs === as) {
      Math.random() < 0.5 ? hs++ : as++
    }
    m.hs = hs
    m.as = as
    m.penWinner = null
    advanceWinner(id)
  }

  function simulateKORound(round) {
    KO_ROUND_IDS[round].forEach((id) => {
      const m = koMatches[id]
      if (!m.homeTeam || !m.awayTeam || m.hs !== null) return
      let hs = randGoals()
      let as = randGoals()
      if (hs === as) {
        Math.random() < 0.5 ? hs++ : as++
      }
      m.hs = hs
      m.as = as
      m.penWinner = null
      advanceWinner(id)
    })
  }

  function simulateKOWeek(weekIdx) {
    const round = WEEK_TO_KO[weekIdx]
    if (!round) return
    simulateKORound(round)
    showToast(`${WEEK_LABELS[weekIdx]} simüle edildi!`)
  }

  function simulateAllKO() {
    ;['qf', 'sf', 'f', 'gf'].forEach((r) => simulateKORound(r))
    showToast('Tüm eleme turu simüle edildi!')
  }

  function resetKOWeek(weekIdx) {
    const round = WEEK_TO_KO[weekIdx]
    if (!round) return
    KO_ROUND_IDS[round].forEach((id) => clearFromMatch(id))
    populateKOFromGroups()
  }

  function resetAllKO() {
    ALL_KO_IDS.forEach((id) => {
      koMatches[id].hs = null
      koMatches[id].as = null
      koMatches[id].penWinner = null
    })
    populateKOFromGroups()
    showToast('Eleme turu sıfırlandı')
  }

  function setKOScore(id, side, val) {
    const m = koMatches[id]
    const v = val === '' ? null : parseInt(val)
    if (v !== null && (isNaN(v) || v < 0)) return
    clearFromMatch(id)
    if (side === 'h') m.hs = v
    else m.as = v
    if (m.hs !== null && m.as !== null) {
      if (m.hs === m.as) {
        m.penWinner = Math.random() < 0.5 ? 'home' : 'away'
      } else {
        m.penWinner = null
      }
      advanceWinner(id)
    }
  }

  // ── Week status ──

  function isWeekComplete(weekIdx) {
    if (weekIdx < 3) {
      return GROUP_KEYS.every((g) =>
        groupMatches[g][weekIdx].every(
          (m) => m.hs !== null && m.as !== null
        )
      )
    }
    const round = WEEK_TO_KO[weekIdx]
    if (!round) return false
    return KO_ROUND_IDS[round].every(
      (id) => koMatches[id].hs !== null && koMatches[id].as !== null
    )
  }

  function isWeekPartial(weekIdx) {
    if (weekIdx < 3) {
      const has = GROUP_KEYS.some((g) =>
        groupMatches[g][weekIdx].some(
          (m) => m.hs !== null && m.as !== null
        )
      )
      return has && !isWeekComplete(weekIdx)
    }
    const round = WEEK_TO_KO[weekIdx]
    if (!round) return false
    const has = KO_ROUND_IDS[round].some(
      (id) => koMatches[id].hs !== null && koMatches[id].as !== null
    )
    return has && !isWeekComplete(weekIdx)
  }

  // ── Builder ──

  function swapBuilderTeams(group, fromIdx, toIdx) {
    const arr = builderOrder[group]
    const item = arr.splice(fromIdx, 1)[0]
    arr.splice(toIdx, 0, item)
  }

  function getBuilderMatchups() {
    return QF_TEMPLATE.map((qt) => ({
      id: qt.id,
      homeTag: qt.home[0] + (qt.home[1] + 1),
      awayTag: qt.away[0] + (qt.away[1] + 1),
      homeTeam: builderOrder[qt.home[0]][qt.home[1]],
      awayTeam: builderOrder[qt.away[0]][qt.away[1]],
    }))
  }

  function getChampion() {
    return getKOWinner('gf')
  }

  // ── Kick off ──
  init()

  return {
    currentWeek,
    activeTab,
    toastMessage,
    toastVisible,
    groupMatches,
    koMatches,
    builderOrder,
    calcStandings,
    getTeamByRank,
    populateKOFromGroups,
    getKOWinner,
    simulateGroupMatch,
    simulateGroupWeek,
    simulateAllGroups,
    resetGroupWeek,
    resetAllGroups,
    setGroupScore,
    simulateKOMatch,
    simulateKORound,
    simulateKOWeek,
    simulateAllKO,
    resetKOWeek,
    resetAllKO,
    setKOScore,
    isWeekComplete,
    isWeekPartial,
    swapBuilderTeams,
    getBuilderMatchups,
    getChampion,
    showToast,
  }
}
