import { LeagueConfig, LeagueDrawState, LeagueId, OrderOption, OrderOptionId, Team, GroupSlot } from '../types';

export const ORDER_OPTIONS: Record<OrderOptionId, OrderOption> = {
  A: {
    id: 'A',
    label: 'OPSI A',
    description: 'Urutan Pertandingan Standar (Tim 1 Main Awal)',
    matches: [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    sequenceText: '1 vs 2  ·  1 vs 3  ·  2 vs 3',
  },
  B: {
    id: 'B',
    label: 'OPSI B',
    description: 'Urutan Pertandingan Rotasi Tengah (Tim 2 Main Awal)',
    matches: [
      [2, 3],
      [2, 1],
      [1, 3],
    ],
    sequenceText: '2 vs 3  ·  2 vs 1  ·  1 vs 3',
  },
  C: {
    id: 'C',
    label: 'OPSI C',
    description: 'Urutan Pertandingan Terbalik (Tim 3 Main Awal)',
    matches: [
      [3, 1],
      [3, 2],
      [2, 1],
    ],
    sequenceText: '3 vs 1  ·  3 vs 2  ·  2 vs 1',
  },
};

export const INITIAL_LEAGUES: LeagueConfig[] = [
  {
    id: 'liga1',
    name: 'LIGA 1',
    shortName: 'Liga 1',
    subtitle: 'Divisi Utama · 12 Tim (3 POT · 4 Grup A–D)',
    totalTeams: 12,
    hasPots: true,
    groups: ['A', 'B', 'C', 'D'],
    groupMatchesCount: 12, // 4 grup x 3 match
    knockoutMatchesCount: 7, // 4 QF + 2 SF + 1 Final
  },
  {
    id: 'liga2',
    name: 'LIGA 2',
    shortName: 'Liga 2',
    subtitle: 'Divisi Eksekutif · 12 Tim (3 POT · 4 Grup A–D)',
    totalTeams: 12,
    hasPots: true,
    groups: ['A', 'B', 'C', 'D'],
    groupMatchesCount: 12,
    knockoutMatchesCount: 7,
  },
  {
    id: 'liga3',
    name: 'LIGA 3',
    shortName: 'Liga 3',
    subtitle: 'Divisi Kompetisi · 12 Tim (3 POT · 4 Grup A–D)',
    totalTeams: 12,
    hasPots: true,
    groups: ['A', 'B', 'C', 'D'],
    groupMatchesCount: 12,
    knockoutMatchesCount: 7,
  },
  {
    id: 'liga4',
    name: 'LIGA 4',
    shortName: 'Liga 4',
    subtitle: 'Divisi Terbuka · 15+ Tim (Fleksibel · Tambah Grup & Tambah Tim)',
    totalTeams: 15,
    hasPots: false,
    groups: ['A', 'B', 'C', 'D', 'E'],
    groupMatchesCount: 15, // 5 grup x 3 match
    knockoutMatchesCount: 7,
  },
];

export const LEAGUES = INITIAL_LEAGUES;

export const INITIAL_TEAMS: Team[] = [
  // LIGA 1 (12 Tim)
  // POT 1
  { id: 'L1-01', number: 1, name: 'SMPN 1 PARAKAN', leagueId: 'liga1', pot: 1 },
  { id: 'L1-02', number: 2, name: 'SMPN 1 KALORAN', leagueId: 'liga1', pot: 1 },
  { id: 'L1-03', number: 3, name: 'SMPN 1 KEDU', leagueId: 'liga1', pot: 1 },
  { id: 'L1-04', number: 4, name: 'SMPN 1 BULU', leagueId: 'liga1', pot: 1 },
  // POT 2
  { id: 'L1-05', number: 5, name: 'SMPN 1 NGADIREJO', leagueId: 'liga1', pot: 2 },
  { id: 'L1-06', number: 6, name: 'SMPN 2 KEDU', leagueId: 'liga1', pot: 2 },
  { id: 'L1-07', number: 7, name: 'SMPN 1 KRANGGAN', leagueId: 'liga1', pot: 2 },
  { id: 'L1-08', number: 8, name: 'SMPN 3 KALORAN', leagueId: 'liga1', pot: 2 },
  // POT 3
  { id: 'L1-09', number: 9, name: 'SMPN 1 BANSARI', leagueId: 'liga1', pot: 3 },
  { id: 'L1-10', number: 10, name: 'SMPN 1 TEMANGGUNG', leagueId: 'liga1', pot: 3 },
  { id: 'L1-11', number: 11, name: 'SMPN 1 TEMBARAK', leagueId: 'liga1', pot: 3 },
  { id: 'L1-12', number: 12, name: 'SMPN 6 TEMANGGUNG', leagueId: 'liga1', pot: 3 },

  // LIGA 2 (12 Tim)
  // POT 1
  { id: 'L2-01', number: 1, name: 'SMPN 1 KANDANGAN', leagueId: 'liga2', pot: 1 },
  { id: 'L2-02', number: 2, name: 'SMPN 2 TEMANGGUNG', leagueId: 'liga2', pot: 1 },
  { id: 'L2-03', number: 3, name: 'SMP ISLAM NGADIREJO', leagueId: 'liga2', pot: 1 },
  { id: 'L2-04', number: 4, name: 'SMPN 1 PRINGSURAT', leagueId: 'liga2', pot: 1 },
  // POT 2
  { id: 'L2-05', number: 5, name: 'SMPN 1 TRETEP', leagueId: 'liga2', pot: 2 },
  { id: 'L2-06', number: 6, name: 'SMP REMAJA', leagueId: 'liga2', pot: 2 },
  { id: 'L2-07', number: 7, name: 'SMPN 3 TEMANGGUNG', leagueId: 'liga2', pot: 2 },
  { id: 'L2-08', number: 8, name: 'SMPN 1 JUMO', leagueId: 'liga2', pot: 2 },
  // POT 3
  { id: 'L2-09', number: 9, name: 'SMPN 1 TLOGOMULYO', leagueId: 'liga2', pot: 3 },
  { id: 'L2-10', number: 10, name: 'SMPN 4 TEMANGGUNG', leagueId: 'liga2', pot: 3 },
  { id: 'L2-11', number: 11, name: 'SMPN 2 BULU', leagueId: 'liga2', pot: 3 },
  { id: 'L2-12', number: 12, name: 'MTsN 1 TEMANGGUNG', leagueId: 'liga2', pot: 3 },

  // LIGA 3 (12 Tim)
  // POT 1
  { id: 'L3-01', number: 1, name: "MTs MA'ARIF GEMAWANG", leagueId: 'liga3', pot: 1 },
  { id: 'L3-02', number: 2, name: 'SMPN 1 CANDIROTO', leagueId: 'liga3', pot: 1 },
  { id: 'L3-03', number: 3, name: "MTs MA'ARIF TEMBARAK", leagueId: 'liga3', pot: 1 },
  { id: 'L3-04', number: 4, name: 'SMPN 2 NGADIREJO', leagueId: 'liga3', pot: 1 },
  // POT 2
  { id: 'L3-05', number: 5, name: 'SMP AL KAUTSAR', leagueId: 'liga3', pot: 2 },
  { id: 'L3-06', number: 6, name: 'SMPN 2 WONOBOYO', leagueId: 'liga3', pot: 2 },
  { id: 'L3-07', number: 7, name: 'SMPN 2 SELOPAMPANG', leagueId: 'liga3', pot: 2 },
  { id: 'L3-08', number: 8, name: 'SMPN 3 KANDANGAN', leagueId: 'liga3', pot: 2 },
  // POT 3
  { id: 'L3-09', number: 9, name: 'SMPN 2 KALORAN', leagueId: 'liga3', pot: 3 },
  { id: 'L3-10', number: 10, name: 'SMPN 2 CANDIROTO', leagueId: 'liga3', pot: 3 },
  { id: 'L3-11', number: 11, name: 'MTSs 2 TEMANGGUNG', leagueId: 'liga3', pot: 3 },
  { id: 'L3-12', number: 12, name: 'SMPN 1 WONOBOYO', leagueId: 'liga3', pot: 3 },

  // LIGA 4 (15 Tim Awal - Tanpa POT, Random All)
  { id: 'L4-01', number: 1, name: 'SMPN 1 KLEDUNG', leagueId: 'liga4', pot: null },
  { id: 'L4-02', number: 2, name: 'SMPN 3 BULU', leagueId: 'liga4', pot: null },
  { id: 'L4-03', number: 3, name: 'SMPN 2 KANDANGAN', leagueId: 'liga4', pot: null },
  { id: 'L4-04', number: 4, name: "MTs MA'ARIF JUMO", leagueId: 'liga4', pot: null },
  { id: 'L4-05', number: 5, name: 'SMPN 1 GEMAWANG', leagueId: 'liga4', pot: null },
  { id: 'L4-06', number: 6, name: 'SMPN 5 TEMANGGUNG', leagueId: 'liga4', pot: null },
  { id: 'L4-07', number: 7, name: 'SMP MUH PK TEMANGGUNG', leagueId: 'liga4', pot: null },
  { id: 'L4-08', number: 8, name: 'SMPN 1 BEJEN', leagueId: 'liga4', pot: null },
  { id: 'L4-09', number: 9, name: 'SMPN 2 PRINGSURAT', leagueId: 'liga4', pot: null },
  { id: 'L4-10', number: 10, name: 'SMP AL IMAN', leagueId: 'liga4', pot: null },
  { id: 'L4-11', number: 11, name: 'SMPN 2 KLEDUNG', leagueId: 'liga4', pot: null },
  { id: 'L4-12', number: 12, name: 'SMPN 2 KRANGGAN', leagueId: 'liga4', pot: null },
  { id: 'L4-13', number: 13, name: 'SMPN 2 TLOGOMULYO', leagueId: 'liga4', pot: null },
  { id: 'L4-14', number: 14, name: 'SMPN 3 KEDU', leagueId: 'liga4', pot: null },
  { id: 'L4-15', number: 15, name: 'SMP NUR LINTANG', leagueId: 'liga4', pot: null },
];

export function createEmptyLeagueSlots(
  leagueId: LeagueId,
  customGroups?: string[],
  slotsPerGroup: number = 3
): GroupSlot[] {
  const defaultGroups =
    leagueId === 'liga4' ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const groupsToUse = customGroups || defaultGroups;
  const slots: GroupSlot[] = [];

  for (const groupName of groupsToUse) {
    for (let slotIndex = 1; slotIndex <= slotsPerGroup; slotIndex++) {
      slots.push({
        groupName,
        slotIndex,
        code: `${groupName}.${slotIndex}`,
        team: null,
      });
    }
  }
  return slots;
}

export function createInitialDrawState(customLeague4Groups?: string[]): Record<LeagueId, LeagueDrawState> {
  return {
    liga1: {
      leagueId: 'liga1',
      slots: createEmptyLeagueSlots('liga1'),
      isCompleted: false,
      lastUpdated: null,
    },
    liga2: {
      leagueId: 'liga2',
      slots: createEmptyLeagueSlots('liga2'),
      isCompleted: false,
      lastUpdated: null,
    },
    liga3: {
      leagueId: 'liga3',
      slots: createEmptyLeagueSlots('liga3'),
      isCompleted: false,
      lastUpdated: null,
    },
    liga4: {
      leagueId: 'liga4',
      slots: createEmptyLeagueSlots('liga4', customLeague4Groups || ['A', 'B', 'C', 'D', 'E']),
      isCompleted: false,
      lastUpdated: null,
    },
  };
}

/**
 * Returns the ordered sequence of slot codes for Step-by-Step drawing
 */
export function getStepByStepSlotOrder(
  leagueId: LeagueId,
  currentSlots?: GroupSlot[]
): string[] {
  if (currentSlots && currentSlots.length > 0) {
    // Sort slots by slotIndex, then groupName
    const sorted = [...currentSlots].sort((a, b) => {
      if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
      return a.groupName.localeCompare(b.groupName);
    });
    return sorted.map((s) => s.code);
  }

  const config = LEAGUES.find((l) => l.id === leagueId)!;
  const codes: string[] = [];
  for (const slotIndex of [1, 2, 3] as const) {
    for (const groupName of config.groups) {
      codes.push(`${groupName}.${slotIndex}`);
    }
  }
  return codes;
}
