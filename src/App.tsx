import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  Disc,
  GitBranch,
  Shuffle,
  Calendar,
  Trophy,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  INITIAL_TEAMS,
  INITIAL_LEAGUES,
  createEmptyLeagueSlots,
  createInitialDrawState,
} from './data/teamsData';
import { ActiveMenu, GroupSlot, LeagueConfig, LeagueDrawState, LeagueId, OrderOptionId, Team } from './types';
import { DashboardView } from './components/DashboardView';
import { DatabaseTimView } from './components/DatabaseTimView';
import { DrawingOrderView } from './components/DrawingOrderView';
import { BracketView } from './components/BracketView';
import { DrawingGroupsView } from './components/DrawingGroupsView';
import { ScheduleView } from './components/ScheduleView';
import { exportGroupsToExcel } from './utils/exportUtils';

const STORAGE_KEY_DRAWS = 'mgmp_cup_2026_draws_v2';
const STORAGE_KEY_ORDER = 'mgmp_cup_2026_order_v2';
const STORAGE_KEY_TEAMS = 'mgmp_cup_2026_teams_v2';
const STORAGE_KEY_LEAGUES = 'mgmp_cup_2026_leagues_v2';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function App() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [selectedLeague, setSelectedLeague] = useState<LeagueId>('liga1');
  const [drawingExpanded, setDrawingExpanded] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Dynamic Teams List (Supports adding teams to Liga 4)
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TEAMS;
  });

  // Dynamic Leagues Configuration (Supports adding groups to Liga 4)
  const [leagues, setLeagues] = useState<LeagueConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEAGUES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LEAGUES;
  });

  // Draw state per league
  const [drawStates, setDrawStates] = useState<Record<LeagueId, LeagueDrawState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAWS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore storage errors
    }
    return createInitialDrawState();
  });

  // Match order schema selection (Option A, B, or C)
  const [selectedOrder, setSelectedOrder] = useState<OrderOptionId | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER) as OrderOptionId | null;
      if (saved === 'A' || saved === 'B' || saved === 'C') return saved;
    } catch {
      // ignore
    }
    return null;
  });

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAWS, JSON.stringify(drawStates));
    } catch {
      // ignore
    }
  }, [drawStates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch {
      // ignore
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEAGUES, JSON.stringify(leagues));
    } catch {
      // ignore
    }
  }, [leagues]);

  useEffect(() => {
    try {
      if (selectedOrder) {
        localStorage.setItem(STORAGE_KEY_ORDER, selectedOrder);
      } else {
        localStorage.removeItem(STORAGE_KEY_ORDER);
      }
    } catch {
      // ignore
    }
  }, [selectedOrder]);

  const handleNavigate = (menu: ActiveMenu, leagueId?: LeagueId) => {
    if (leagueId) {
      setSelectedLeague(leagueId);
    }
    if (menu.startsWith('drawing-')) {
      setDrawingExpanded(true);
    }
    setActiveMenu(menu);
    setMobileSidebarOpen(false);
  };

  const handleUpdateLeagueDraw = (
    leagueId: LeagueId,
    slots: GroupSlot[],
    isCompleted: boolean
  ) => {
    setDrawStates((prev) => ({
      ...prev,
      [leagueId]: {
        leagueId,
        slots,
        isCompleted,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const handleResetLeagueDraw = (leagueId: LeagueId) => {
    setDrawStates((prev) => ({
      ...prev,
      [leagueId]: {
        leagueId,
        slots: createEmptyLeagueSlots(leagueId),
        isCompleted: false,
        lastUpdated: null,
      },
    }));
  };

  /**
   * Liga 4 Dynamic Action: Tambah Grup Baru (e.g. Grup F, Grup G, etc.)
   */
  const handleAddGroupToLeague4 = () => {
    const l4 = leagues.find((l) => l.id === 'liga4') || INITIAL_LEAGUES.find((l) => l.id === 'liga4')!;
    const currentGroups = l4.groups;
    const nextGroupLetter = String.fromCharCode(65 + currentGroups.length);

    // Add new group to Liga 4 configuration
    const updatedGroups = [...currentGroups, nextGroupLetter];
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === 'liga4'
          ? {
              ...l,
              groups: updatedGroups,
              totalTeams: l.totalTeams + 3,
              groupMatchesCount: l.groupMatchesCount + 3,
            }
          : l
      )
    );

    // Add 3 empty slots for this new group (e.g. F.1, F.2, F.3)
    const newSlots: GroupSlot[] = [1, 2, 3].map((slotIdx) => ({
      code: `${nextGroupLetter}.${slotIdx}`,
      groupName: nextGroupLetter,
      slotIndex: slotIdx,
      team: null,
    }));

    setDrawStates((prev) => {
      const currentL4Slots = prev.liga4?.slots || [];
      return {
        ...prev,
        liga4: {
          ...prev.liga4,
          slots: [...currentL4Slots, ...newSlots],
          isCompleted: false,
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  };

  /**
   * Liga 4 Dynamic Action: Tambah Tim Baru ke Grup Tertentu (e.g. slot A.4, B.4, dll)
   */
  const handleAddTeamToGroupSlot = (groupName: string, customTeamName?: string) => {
    const l4Slots = drawStates.liga4?.slots || [];
    const groupSlots = l4Slots.filter((s) => s.groupName === groupName);
    const nextSlotIndex =
      groupSlots.length > 0 ? Math.max(...groupSlots.map((s) => s.slotIndex)) + 1 : 1;
    const newSlotCode = `${groupName}.${nextSlotIndex}`;

    let assignedTeam: Team | null = null;
    if (customTeamName && customTeamName.trim()) {
      const newTeamObj: Team = {
        id: `t-l4-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        number: teams.filter((t) => t.leagueId === 'liga4').length + 1,
        name: customTeamName.toUpperCase().trim(),
        leagueId: 'liga4',
        pot: null,
      };
      setTeams((prev) => [...prev, newTeamObj]);
      assignedTeam = newTeamObj;
    }

    const newSlot: GroupSlot = {
      code: newSlotCode,
      groupName,
      slotIndex: nextSlotIndex,
      team: assignedTeam,
    };

    setDrawStates((prev) => {
      const current = prev.liga4?.slots || [];
      const updatedSlots = [...current, newSlot];
      return {
        ...prev,
        liga4: {
          ...prev.liga4,
          slots: updatedSlots,
          isCompleted: updatedSlots.every((s) => s.team !== null),
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  };

  /**
   * Liga 4 Dynamic Action: Hapus Grup Tambahan
   */
  const handleRemoveGroupFromLeague4 = (groupName: string) => {
    // Only allow removing added groups beyond standard A-E if desired, or any group
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === 'liga4'
          ? {
              ...l,
              groups: l.groups.filter((g) => g !== groupName),
            }
          : l
      )
    );

    setDrawStates((prev) => ({
      ...prev,
      liga4: {
        ...prev.liga4,
        slots: (prev.liga4?.slots || []).filter((s) => s.groupName !== groupName),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  /**
   * Liga 4 Dynamic Action: Hapus Slot Tertentu
   */
  const handleRemoveSlot = (slotCode: string) => {
    setDrawStates((prev) => ({
      ...prev,
      liga4: {
        ...prev.liga4,
        slots: (prev.liga4?.slots || []).filter((s) => s.code !== slotCode),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  /**
   * Register a new Team to Roster
   */
  const handleAddTeamToRoster = (name: string, leagueId: LeagueId) => {
    const newTeam: Team = {
      id: `t-${leagueId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      number: teams.filter((t) => t.leagueId === leagueId).length + 1,
      name: name.toUpperCase().trim(),
      leagueId,
      pot: null,
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  /**
   * Quick simulate all leagues
   */
  const handleQuickSimulateAll = () => {
    const nextStates: Record<LeagueId, LeagueDrawState> = { ...drawStates };

    for (const league of leagues) {
      const leagueTeams = teams.filter((t) => t.leagueId === league.id);
      const currentSlots: GroupSlot[] = drawStates[league.id]?.slots?.length
        ? drawStates[league.id].slots.map((s) => ({ ...s, team: null }))
        : createEmptyLeagueSlots(league.id);

      if (league.hasPots) {
        for (const potNum of [1, 2, 3] as const) {
          const potTeams = shuffleArray(leagueTeams.filter((t) => t.pot === potNum));
          league.groups.forEach((groupName, gIdx) => {
            const targetCode = `${groupName}.${potNum}`;
            const slotObj = currentSlots.find((s) => s.code === targetCode);
            if (slotObj && potTeams[gIdx]) {
              slotObj.team = potTeams[gIdx];
            }
          });
        }
      } else {
        const shuffled = shuffleArray(leagueTeams);
        currentSlots.forEach((slotObj, idx) => {
          slotObj.team = shuffled[idx] || null;
        });
      }

      nextStates[league.id] = {
        leagueId: league.id,
        slots: currentSlots,
        isCompleted: currentSlots.every((s) => s.team !== null),
        lastUpdated: new Date().toISOString(),
      };
    }

    setDrawStates(nextStates);
    if (!selectedOrder) {
      const options: OrderOptionId[] = ['A', 'B', 'C'];
      setSelectedOrder(options[Math.floor(Math.random() * options.length)]);
    }
  };

  const handleResetAll = () => {
    setDrawStates(createInitialDrawState());
    setSelectedOrder(null);
    setTeams(INITIAL_TEAMS);
    setLeagues(INITIAL_LEAGUES);
    try {
      localStorage.removeItem(STORAGE_KEY_DRAWS);
      localStorage.removeItem(STORAGE_KEY_ORDER);
      localStorage.removeItem(STORAGE_KEY_TEAMS);
      localStorage.removeItem(STORAGE_KEY_LEAGUES);
    } catch {
      // ignore
    }
  };

  const menuTitleMap: Record<ActiveMenu, string> = {
    dashboard: 'Dashboard',
    database: `Database Tim Peserta (${teams.length} Tim)`,
    'drawing-order': 'Menu Drawing / Urutan Pertandingan',
    'drawing-bracket': 'Menu Drawing / Bagan 8 Besar',
    'drawing-groups': 'Menu Drawing / Pembagian Grup',
    schedule: 'Jadwal Pertandingan Fase Grup',
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar Navigation (#0F172A Dark Slate Gray) */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-68 bg-[#0F172A] text-white flex flex-col justify-between transition-transform duration-200 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight text-white">
                  MGMP CUP 2026
                </div>
                <div className="text-[11px] font-medium text-violet-400">
                  Futsal Putri SMP/MTs
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              MENU UTAMA
            </div>

            {/* 1. DASHBOARD */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>1. Dashboard</span>
            </button>

            {/* 2. DATABASE TIM PESERTA */}
            <button
              onClick={() => handleNavigate('database')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeMenu === 'database'
                  ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 shrink-0" />
                <span>2. Database Tim Peserta</span>
              </div>
              <span className="font-mono text-[11px] opacity-90 px-1.5 py-0.5 rounded bg-slate-800 text-violet-300">
                {teams.length}
              </span>
            </button>

            {/* 3. MENU DRAWING (With 3 Submenus) */}
            <div className="pt-1">
              <button
                onClick={() => setDrawingExpanded(!drawingExpanded)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Shuffle className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>3. Menu Drawing</span>
                </div>
                {drawingExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {drawingExpanded && (
                <div className="pl-6 pr-1 py-1 space-y-1">
                  <button
                    onClick={() => handleNavigate('drawing-order')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11.5px] transition-colors cursor-pointer ${
                      activeMenu === 'drawing-order'
                        ? 'bg-[#7C3AED] text-white font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Disc className="w-3.5 h-3.5 shrink-0" />
                    <span>A. Urutan Pertandingan</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('drawing-bracket')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11.5px] transition-colors cursor-pointer ${
                      activeMenu === 'drawing-bracket'
                        ? 'bg-[#7C3AED] text-white font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 shrink-0" />
                    <span>B. Bagan 8 Besar</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('drawing-groups')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11.5px] transition-colors cursor-pointer ${
                      activeMenu === 'drawing-groups'
                        ? 'bg-[#7C3AED] text-white font-bold shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shuffle className="w-3.5 h-3.5 shrink-0" />
                      <span>C. Drawing Grup</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      Live
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. JADWAL PERTANDINGAN */}
            <div className="pt-1">
              <button
                onClick={() => handleNavigate('schedule')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeMenu === 'schedule'
                    ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>4. Jadwal Pertandingan</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                  Export
                </span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={() => exportGroupsToExcel(drawStates, 'all', leagues)}
            className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Rekapitulasi (.xlsx)</span>
          </button>

          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              STATUS SISTEM
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-semibold text-slate-200">Format Drawing</span>
              <span className="font-mono text-emerald-400 font-bold">Resmi 2026</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>Total Peserta:</span>
              <span className="font-mono text-white font-bold">{teams.length} Tim</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            MGMP PJOK SMP/MTs Kab. Temanggung · Tahun 2026
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-Only Header (No top menu bar on desktop) */}
        <div className="no-print lg:hidden h-14 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-extrabold text-white tracking-tight">
              MGMP CUP 2026
            </span>
          </div>
          <span className="text-[11px] font-mono text-violet-400 font-bold">
            {menuTitleMap[activeMenu]}
          </span>
        </div>

        {/* Active View Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <div className="no-print mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>Modul Aktif: {menuTitleMap[activeMenu]}</span>
            <span className="font-mono tabular-nums">
              {teams.length} Tim · {leagues.length} Liga · Sistem Setengah Kompetisi
            </span>
          </div>

          {activeMenu === 'dashboard' && (
            <DashboardView
              drawStates={drawStates}
              selectedOrder={selectedOrder}
              onNavigate={handleNavigate}
              onQuickSimulateAll={handleQuickSimulateAll}
              onResetAll={handleResetAll}
              allTeams={teams}
              leagues={leagues}
            />
          )}

          {activeMenu === 'database' && (
            <DatabaseTimView
              selectedLeague={selectedLeague}
              onSelectLeague={setSelectedLeague}
              drawStates={drawStates}
              onNavigate={handleNavigate}
              allTeams={teams}
              leagues={leagues}
              onAddTeamToRoster={handleAddTeamToRoster}
            />
          )}

          {activeMenu === 'drawing-order' && (
            <DrawingOrderView
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onNavigate={handleNavigate}
            />
          )}

          {activeMenu === 'drawing-bracket' && <BracketView drawStates={drawStates} />}

          {activeMenu === 'drawing-groups' && (
            <DrawingGroupsView
              selectedLeague={selectedLeague}
              onSelectLeague={setSelectedLeague}
              drawStates={drawStates}
              onUpdateLeagueDraw={handleUpdateLeagueDraw}
              onResetLeagueDraw={handleResetLeagueDraw}
              selectedOrder={selectedOrder}
              onNavigate={handleNavigate}
              allTeams={teams}
              leagues={leagues}
              onAddGroupToLeague4={handleAddGroupToLeague4}
              onAddTeamToGroupSlot={handleAddTeamToGroupSlot}
              onRemoveGroupFromLeague4={handleRemoveGroupFromLeague4}
              onRemoveSlot={handleRemoveSlot}
              onAddTeamToRoster={handleAddTeamToRoster}
            />
          )}

          {activeMenu === 'schedule' && (
            <ScheduleView
              drawStates={drawStates}
              selectedOrder={selectedOrder}
              onNavigate={handleNavigate}
              leagues={leagues}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
