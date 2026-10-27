import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Shuffle,
  Play,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  FileDown,
  CheckCircle2,
  Disc,
  Layers,
  Calendar,
  Printer,
  PlusCircle,
  Trash2,
  X,
  UserPlus,
  Trophy,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { INITIAL_LEAGUES, getStepByStepSlotOrder } from '../data/teamsData';
import {
  exportGroupsToExcel,
  exportGroupsToPDF,
  exportGroupsToWord,
} from '../utils/exportUtils';
import {
  ActiveMenu,
  GroupSlot,
  LeagueConfig,
  LeagueDrawState,
  LeagueId,
  OrderOptionId,
  Team,
} from '../types';

interface DrawingGroupsViewProps {
  selectedLeague: LeagueId;
  onSelectLeague: (league: LeagueId) => void;
  drawStates: Record<LeagueId, LeagueDrawState>;
  onUpdateLeagueDraw: (leagueId: LeagueId, slots: GroupSlot[], isCompleted: boolean) => void;
  onResetLeagueDraw: (leagueId: LeagueId) => void;
  selectedOrder: OrderOptionId | null;
  onNavigate: (menu: ActiveMenu, leagueId?: LeagueId) => void;
  allTeams: Team[];
  leagues?: LeagueConfig[];
  onAddGroupToLeague4?: () => void;
  onAddTeamToGroupSlot?: (groupName: string, teamName?: string) => void;
  onRemoveGroupFromLeague4?: (groupName: string) => void;
  onRemoveSlot?: (slotCode: string) => void;
  onAddTeamToRoster?: (name: string, leagueId: LeagueId) => void;
}

type DrawMode = 'step' | 'full';

const SLICE_COLORS = [
  '#7C3AED', // Vivid Violet
  '#2563EB', // Electric Blue
  '#059669', // Emerald Green
  '#EA580C', // Fiery Orange
  '#E11D48', // Crimson Rose
  '#0891B2', // Cyan
  '#D97706', // Amber Gold
  '#4F46E5', // Indigo
  '#0D9488', // Teal
  '#9333EA', // Purple
  '#DC2626', // Red
  '#2563EB', // Blue
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#6366F1', // Indigo
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Sound Synthesizer via Web Audio API (Ticking & Victory sounds)
function playTickSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // AudioContext blocked or not supported
  }
}

function playWinSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.35);
    });
  } catch {
    // ignore
  }
}

export const DrawingGroupsView: React.FC<DrawingGroupsViewProps> = ({
  selectedLeague,
  onSelectLeague,
  drawStates,
  onUpdateLeagueDraw,
  onResetLeagueDraw,
  selectedOrder,
  onNavigate,
  allTeams,
  leagues = INITIAL_LEAGUES,
  onAddGroupToLeague4,
  onAddTeamToGroupSlot,
  onRemoveGroupFromLeague4,
  onRemoveSlot,
  onAddTeamToRoster,
}) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('step');
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number>(5.0);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual Target Slot Override
  const [manualTargetSlotCode, setManualTargetSlotCode] = useState<string | null>(null);

  // Currently highlighted team during the 5s spin
  const [highlightedTeam, setHighlightedTeam] = useState<Team | null>(null);

  // Winner announcement modal / card
  const [announcementModal, setAnnouncementModal] = useState<{
    teamName: string;
    slotCode: string;
    groupName: string;
    potLabel: string;
  } | null>(null);

  // Modal for adding new team in Liga 4
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [targetGroupForNewTeam, setTargetGroupForNewTeam] = useState<string | null>(null);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');

  const timerRef = useRef<number | null>(null);
  const tickerIntervalRef = useRef<number | null>(null);

  const leagueConfig =
    leagues.find((l) => l.id === selectedLeague) ||
    INITIAL_LEAGUES.find((l) => l.id === selectedLeague)!;
  const currentDrawState = drawStates[selectedLeague];
  const allLeagueTeams = allTeams.filter((t) => t.leagueId === selectedLeague);

  // Drawn team IDs
  const drawnTeamIds = useMemo(() => {
    return new Set(
      (currentDrawState?.slots || [])
        .filter((s) => s.team !== null)
        .map((s) => s.team!.id)
    );
  }, [currentDrawState]);

  // Remaining unassigned teams
  const remainingTeams = useMemo(() => {
    return allLeagueTeams.filter((t) => !drawnTeamIds.has(t.id));
  }, [allLeagueTeams, drawnTeamIds]);

  // Active group names in slots
  const activeGroupNames = useMemo(() => {
    return Array.from(new Set((currentDrawState?.slots || []).map((s) => s.groupName))).sort();
  }, [currentDrawState]);

  // Determine next empty slot in official sequence
  const orderedSlotCodes = useMemo(() => {
    return getStepByStepSlotOrder(selectedLeague, currentDrawState?.slots || []);
  }, [selectedLeague, currentDrawState]);

  const defaultNextEmptySlotCode = useMemo(() => {
    return (
      orderedSlotCodes.find((code) => {
        const slot = currentDrawState?.slots.find((s) => s.code === code);
        return slot && slot.team === null;
      }) || null
    );
  }, [orderedSlotCodes, currentDrawState]);

  // Active target slot (either user clicked on a specific slot, or the default next empty slot)
  const effectiveTargetSlotCode = manualTargetSlotCode || defaultNextEmptySlotCode;
  const effectiveTargetSlot = useMemo(() => {
    return currentDrawState?.slots.find((s) => s.code === effectiveTargetSlotCode) || null;
  }, [currentDrawState, effectiveTargetSlotCode]);

  // Candidates for the current target slot
  const candidatePool: Team[] = useMemo(() => {
    if (!effectiveTargetSlot) return remainingTeams;
    if (leagueConfig.hasPots) {
      // Must match POT = slotIndex
      return remainingTeams.filter((t) => t.pot === effectiveTargetSlot.slotIndex);
    }
    // Liga 4: all remaining teams are eligible
    return remainingTeams;
  }, [effectiveTargetSlot, leagueConfig.hasPots, remainingTeams]);

  // The teams displayed on the spinner wheel
  const wheelSlices: Team[] = useMemo(() => {
    if (drawMode === 'full') {
      return allLeagueTeams.slice(0, 16);
    }
    return candidatePool.length > 0 ? candidatePool : allLeagueTeams.slice(0, 8);
  }, [drawMode, candidatePool, allLeagueTeams]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (tickerIntervalRef.current) window.clearInterval(tickerIntervalRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (tickerIntervalRef.current) window.clearInterval(tickerIntervalRef.current);
  };

  /**
   * START 5-SECOND STEP-BY-STEP SPINNER WHEEL
   */
  const handleStartStepSpin = () => {
    if (isSpinning || !effectiveTargetSlot || candidatePool.length === 0) return;
    clearTimers();
    setIsSpinning(true);
    setCountdown(5.0);
    setAnnouncementModal(null);

    // Pick uniform random winner from candidate pool
    const winnerIndex = Math.floor(Math.random() * candidatePool.length);
    const chosenWinner = candidatePool[winnerIndex];

    // Calculate rotation angle to align chosenWinner with top pointer (0 deg)
    const N = wheelSlices.length;
    const sliceAngle = 360 / N;
    // Find index of chosenWinner in wheelSlices
    const sliceIdx = wheelSlices.findIndex((t) => t.id === chosenWinner.id);
    const effectiveSliceIdx = sliceIdx >= 0 ? sliceIdx : 0;
    const midAngle = effectiveSliceIdx * sliceAngle + sliceAngle / 2;

    // To place midAngle at 0 deg (top), we need (360 - midAngle)
    const targetSectorOffset = (360 - midAngle + 360) % 360;
    const baseTurns = 360 * 10; // 10 fast full rotations over 5s
    const currentBase = wheelRotation - (wheelRotation % 360);
    const finalRotation = currentBase + baseTurns + targetSectorOffset;
    setWheelRotation(finalRotation);

    const startTime = performance.now();
    const duration = 5000;

    // Ticker sound & candidate highlighting
    let tickerCount = 0;
    tickerIntervalRef.current = window.setInterval(() => {
      tickerCount++;
      const randomIdx = (effectiveSliceIdx + tickerCount) % wheelSlices.length;
      setHighlightedTeam(wheelSlices[randomIdx]);
      if (soundEnabled && tickerCount % 2 === 0) {
        playTickSound();
      }
    }, 70);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setCountdown(remaining);

      if (elapsed >= duration) {
        clearTimers();
        setIsSpinning(false);
        setCountdown(0);
        setHighlightedTeam(chosenWinner);

        // Update slots state
        const updatedSlots = currentDrawState.slots.map((s) =>
          s.code === effectiveTargetSlot.code ? { ...s, team: chosenWinner } : s
        );
        const allFilled = updatedSlots.every((s) => s.team !== null);
        onUpdateLeagueDraw(selectedLeague, updatedSlots, allFilled);

        // Success Announcement & Sounds
        if (soundEnabled) playWinSound();
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        setAnnouncementModal({
          teamName: chosenWinner.name,
          slotCode: effectiveTargetSlot.code,
          groupName: effectiveTargetSlot.groupName,
          potLabel: chosenWinner.pot ? `POT ${chosenWinner.pot}` : 'Random All',
        });

        // Reset manual target
        setManualTargetSlotCode(null);
      }
    }, 50);
  };

  /**
   * START 5-SECOND FULL LEAGUE SPINNER WHEEL
   */
  const handleStartFullSpin = () => {
    if (isSpinning) return;
    clearTimers();
    setIsSpinning(true);
    setCountdown(5.0);
    setAnnouncementModal(null);

    const baseTurns = 360 * 12;
    const finalRotation = wheelRotation + baseTurns + Math.floor(Math.random() * 360);
    setWheelRotation(finalRotation);

    const startTime = performance.now();
    const duration = 5000;

    let tickerCount = 0;
    tickerIntervalRef.current = window.setInterval(() => {
      tickerCount++;
      const pick = allLeagueTeams[Math.floor(Math.random() * allLeagueTeams.length)];
      if (pick) setHighlightedTeam(pick);
      if (soundEnabled && tickerCount % 2 === 0) {
        playTickSound();
      }
    }, 75);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setCountdown(remaining);

      if (elapsed >= duration) {
        clearTimers();
        setIsSpinning(false);
        setCountdown(0);

        // Assign all slots according to league regulations
        const newSlots: GroupSlot[] = currentDrawState.slots.map((s) => ({
          ...s,
          team: null,
        }));

        if (leagueConfig.hasPots) {
          for (const potNum of [1, 2, 3] as const) {
            const potTeams = shuffleArray(allLeagueTeams.filter((t) => t.pot === potNum));
            leagueConfig.groups.forEach((groupName, gIdx) => {
              const targetCode = `${groupName}.${potNum}`;
              const slotObj = newSlots.find((s) => s.code === targetCode);
              if (slotObj && potTeams[gIdx]) {
                slotObj.team = potTeams[gIdx];
              }
            });
          }
        } else {
          const shuffled = shuffleArray(allLeagueTeams);
          newSlots.forEach((slotObj, idx) => {
            slotObj.team = shuffled[idx] || null;
          });
        }

        const isFullDone = newSlots.every((s) => s.team !== null);
        onUpdateLeagueDraw(selectedLeague, newSlots, isFullDone);

        if (soundEnabled) playWinSound();
        try {
          confetti({ particleCount: 110, spread: 80, origin: { y: 0.55 } });
        } catch {
          // ignore
        }

        setAnnouncementModal({
          teamName: `Seluruh Tim ${leagueConfig.name} Berhasil Terundi`,
          slotCode: 'SEMUA GRUP',
          groupName: activeGroupNames.join(', '),
          potLabel: leagueConfig.hasPots ? 'Sistem POT 1–3' : 'Random All',
        });
      }
    }, 50);
  };

  const handleCreateTeamInGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGroupForNewTeam || !newTeamNameInput.trim()) return;
    if (onAddTeamToGroupSlot) {
      onAddTeamToGroupSlot(targetGroupForNewTeam, newTeamNameInput.trim());
    }
    setNewTeamNameInput('');
    setTargetGroupForNewTeam(null);
    setShowAddTeamModal(false);
  };

  // Pre-calculate SVG pie wedges for current wheelSlices
  const sliceCount = wheelSlices.length;
  const sliceDeg = 360 / (sliceCount || 1);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          TOP BAR: TITLE & COMPACT EXPORT SHORTCUTS
          ========================================================================= */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            <Disc className="w-4 h-4" />
            <span>ROULETTE SPINNER SYSTEM · 5 DETIK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Drawing Pembagian Grup — {leagueConfig.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengundian interaktif dengan Spinner Wheel 5 detik beranimasi jelas, transparan, dan terstandar MGMP PJOK 2026.
          </p>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-violet-50 text-[#7C3AED] border-violet-200 hover:bg-violet-100'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={soundEnabled ? 'Suara Tik & Kemenangan Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Audio Aktif' : 'Mute'}</span>
          </button>

          <button
            onClick={() => exportGroupsToPDF(drawStates, selectedLeague, selectedOrder, leagues)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#EF4444] hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={() => exportGroupsToExcel(drawStates, selectedLeague, leagues)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={() => exportGroupsToWord(drawStates, selectedLeague, selectedOrder, leagues)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            Word
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      </div>

      {/* =========================================================================
          LEAGUE SELECTOR TABS (4 SOLID KPI CARDS)
          ========================================================================= */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
        {leagues.map((l) => {
          const isSelected = l.id === selectedLeague;
          const st = drawStates[l.id];
          const filled = st ? st.slots.filter((s) => s.team !== null).length : 0;
          const totalSlots = st ? st.slots.length : l.totalTeams;

          return (
            <button
              key={l.id}
              disabled={isSpinning}
              onClick={() => {
                onSelectLeague(l.id);
                setAnnouncementModal(null);
                setManualTargetSlotCode(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#7C3AED]/50'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">{l.name}</span>
                  {st?.isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  )}
                </div>
                <div
                  className={`text-[11px] font-medium mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {l.hasPots ? '3 POT · 4 Grup' : `${activeGroupNames.length} Grup · Acak Bebas`}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div
                  className={`text-sm font-black ${
                    st?.isCompleted
                      ? 'text-[#059669]'
                      : isSelected
                      ? 'text-violet-300'
                      : 'text-slate-700'
                  }`}
                >
                  {filled}/{totalSlots}
                </div>
                <div className="text-[10px] text-slate-400">Terisi</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          LIGA 4 MANAGEMENT BAR (IF LIGA 4 SELECTED)
          ========================================================================= */}
      {selectedLeague === 'liga4' && (
        <div className="no-print bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-400/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#059669] text-white text-[10px] font-black uppercase tracking-wider">
                FITUR DINAMIS LIGA 4
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Grup Baru & Tambah Tim Tiap Grup
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Anda bebas menambahkan grup baru (Grup F, G, dll.) atau menambahkan slot tim langsung ke grup mana pun.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onAddGroupToLeague4 && (
              <button
                onClick={onAddGroupToLeague4}
                disabled={isSpinning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Tambah Grup Baru
              </button>
            )}

            {onAddTeamToRoster && (
              <button
                onClick={() => {
                  setTargetGroupForNewTeam(activeGroupNames[0] || 'A');
                  setShowAddTeamModal(true);
                }}
                disabled={isSpinning}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Daftarkan Tim Baru
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          THE SPINNER ARENA: 5-SECOND CLEAR VISUAL ROULETTE WHEEL & CONTROLS
          ========================================================================= */}
      <div className="no-print bg-[#0F172A] border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#059669]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Visual 5-Second Spinner Wheel (Clear, Center-Stage) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Countdown & Wheel Header */}
            <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-violet-300 font-bold">
                <Disc className={`w-4 h-4 ${isSpinning ? 'animate-spin text-amber-400' : ''}`} />
                <span>SPINNER WHEEL</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tabular-nums font-mono border ${
                  isSpinning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isSpinning ? `${countdown.toFixed(1)}s BERPUTAR` : 'DURASI: 5.0 DETIK'}
              </span>
            </div>

            {/* The Physical Spinner Wheel Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Glowing Chrome Frame */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-700 shadow-2xl bg-slate-900" />
              <div className="absolute -inset-1 rounded-full border border-amber-400/40 pointer-events-none" />

              {/* Top Pointer Needle (Fixed at 12 o'clock) */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <div className="w-6 h-6 bg-[#EF4444] rounded-sm rotate-45 shadow-lg border-2 border-white" />
                <div className="w-1.5 h-3 bg-white -mt-2 rounded-full" />
              </div>

              {/* Rotating SVG Wheel */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning
                    ? 'transform 5000ms cubic-bezier(0.12, 0.85, 0.2, 1)'
                    : 'none',
                }}
                className="w-full h-full rounded-full overflow-hidden shadow-inner flex items-center justify-center"
              >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </radialGradient>
                  </defs>

                  {/* Slices */}
                  {wheelSlices.map((sliceTeam, i) => {
                    const startAngle = i * sliceDeg;
                    const endAngle = (i + 1) * sliceDeg;
                    const rad1 = ((startAngle - 90) * Math.PI) / 180;
                    const rad2 = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = 150 + 145 * Math.cos(rad1);
                    const y1 = 150 + 145 * Math.sin(rad1);
                    const x2 = 150 + 145 * Math.cos(rad2);
                    const y2 = 150 + 145 * Math.sin(rad2);

                    const largeArc = sliceDeg > 180 ? 1 : 0;
                    const d = `M 150 150 L ${x1} ${y1} A 145 145 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    const midAngle = startAngle + sliceDeg / 2;
                    const textRad = ((midAngle - 90) * Math.PI) / 180;
                    const tx = 150 + 95 * Math.cos(textRad);
                    const ty = 150 + 95 * Math.sin(textRad);

                    const color = SLICE_COLORS[i % SLICE_COLORS.length];

                    return (
                      <g key={sliceTeam.id || i}>
                        <path
                          d={d}
                          fill={color}
                          stroke="#0F172A"
                          strokeWidth="2.5"
                          className="transition-colors"
                        />
                        {/* Text Label */}
                        <g transform={`translate(${tx}, ${ty}) rotate(${midAngle})`}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#FFFFFF"
                            fontSize={sliceCount > 10 ? '9' : '11'}
                            fontWeight="900"
                            letterSpacing="0.05em"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                          >
                            {sliceTeam.name.length > 12
                              ? `${sliceTeam.name.slice(0, 10)}..`
                              : sliceTeam.name}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Center Hub */}
                  <circle cx="150" cy="150" r="30" fill="url(#centerGradient)" stroke="#FFFFFF" strokeWidth="3" />
                  <circle cx="150" cy="150" r="22" fill="#0F172A" />
                  <text
                    x="150"
                    y="154"
                    textAnchor="middle"
                    fill="#F59E0B"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    MGMP
                  </text>
                </svg>
              </div>

              {/* Progress Ring during 5s spin */}
              {isSpinning && (
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-ping pointer-events-none opacity-20" />
              )}
            </div>

            {/* Currently Focused Candidate Display */}
            <div className="mt-4 text-center w-full">
              <div className="text-[11px] font-mono text-slate-400">
                {isSpinning ? 'TIM SEDANG DIACAK:' : 'TIM DALAM SPINNER:'}
              </div>
              <div className="text-sm sm:text-base font-black text-amber-300 truncate max-w-xs mx-auto mt-0.5">
                {highlightedTeam ? highlightedTeam.name : 'Siap Diputar Selama 5 Detik'}
              </div>
            </div>
          </div>

          {/* Right Column: Controls, Target Posisi, & Pool Queue (Zero Empty Space) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                disabled={isSpinning}
                onClick={() => setDrawMode('step')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drawMode === 'step'
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Spin Bertahap Per-Slot
              </button>
              <button
                disabled={isSpinning}
                onClick={() => setDrawMode('full')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  drawMode === 'full'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Spin Menyeluruh (Semua Grup)
              </button>
            </div>

            {/* Target Information Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider font-bold">
                    TARGET PENGUNDIAN AKTIF
                  </span>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                    {drawMode === 'step' ? (
                      effectiveTargetSlot ? (
                        <>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono">
                            Slot {effectiveTargetSlot.code}
                          </span>
                          <span>Grup {effectiveTargetSlot.groupName}</span>
                          {leagueConfig.hasPots && (
                            <span className="text-xs text-slate-400 font-normal">
                              (Khusus POT {effectiveTargetSlot.slotIndex})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#059669]">Seluruh Slot Sudah Terisi Lengkap</span>
                      )
                    ) : (
                      <span>Seluruh {activeGroupNames.length} Grup Sekaligus</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-300">
                    Sisa: {remainingTeams.length} Tim
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {leagueConfig.hasPots ? 'Sistem Unggulan POT 1-3' : 'Random Murni'}
                  </div>
                </div>
              </div>

              {/* Candidate Chips Carousel / Grid (Neat & Compact) */}
              <div className="pt-3">
                <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Kandidat Siap Diundi:{' '}
                    <strong className="text-amber-300 font-mono">
                      {drawMode === 'step' ? candidatePool.length : allLeagueTeams.length} Tim
                    </strong>
                  </span>
                  {drawMode === 'step' && remainingTeams.length > candidatePool.length && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Sesuai POT {effectiveTargetSlot?.slotIndex})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {(drawMode === 'step' ? candidatePool : allLeagueTeams).map((t) => (
                    <span
                      key={t.id}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                        highlightedTeam?.id === t.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300 scale-105 transition-transform'
                          : 'bg-slate-900 text-slate-200 border-slate-700/80'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center">
                        {t.number}
                      </span>
                      <span>{t.name}</span>
                    </span>
                  ))}
                  {(drawMode === 'step' ? candidatePool : allLeagueTeams).length === 0 && (
                    <span className="text-xs text-slate-400 py-1">
                      Tidak ada antrean tim yang tersisa.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* The Big Action Buttons */}
            <div className="space-y-2 pt-1">
              {drawMode === 'step' ? (
                <button
                  onClick={handleStartStepSpin}
                  disabled={isSpinning || !effectiveTargetSlot || candidatePool.length === 0}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                    isSpinning
                      ? 'bg-slate-800 text-amber-300 cursor-not-allowed border border-amber-400/50'
                      : !effectiveTargetSlot || candidatePool.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#2563EB] hover:brightness-110 text-white active:scale-[0.99]'
                  }`}
                >
                  <Play className={`w-5 h-5 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? `SPINNER SEDANG BERPUTAR (${countdown.toFixed(1)}s)...`
                      : effectiveTargetSlot
                      ? `PUTAR SPINNER 5 DETIK UNTUK POSISI ${effectiveTargetSlot.code}`
                      : 'SEMUA POSISI TELAH TERISI'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleStartFullSpin}
                  disabled={isSpinning}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                    isSpinning
                      ? 'bg-slate-800 text-emerald-300 cursor-not-allowed border border-emerald-400/50'
                      : 'bg-gradient-to-r from-[#059669] via-emerald-600 to-teal-600 hover:brightness-110 text-white active:scale-[0.99]'
                  }`}
                >
                  <Play className={`w-5 h-5 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? `SPINNER BERPUTAR MENYELURUH (${countdown.toFixed(1)}s)...`
                      : `MULAI SPIN MENYELURUH SEMUA GRUP (5 DETIK)`}
                  </span>
                </button>
              )}

              {/* Utility Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    onResetLeagueDraw(selectedLeague);
                    setAnnouncementModal(null);
                    setManualTargetSlotCode(null);
                  }}
                  disabled={isSpinning}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset {leagueConfig.name}</span>
                </button>

                <button
                  onClick={() => onNavigate('schedule', selectedLeague)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-violet-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  <span>Lihat Jadwal Pertandingan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          GROUP CARDS GRID (COMPACT, BALANCED, NO LARGE EMPTY SPACES)
          For Liga 1-3: 4 Columns (A, B, C, D)
          For Liga 4: 5 Columns or Responsive Grid
          ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Bagan Grup {leagueConfig.name} ({activeGroupNames.length} Grup Resmi)
            </h2>
            <span className="text-xs text-slate-500 hidden sm:inline">
              · Klik pada slot kosong untuk memilih target pengundian
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-slate-600">
            Terisi:{' '}
            {currentDrawState?.slots.filter((s) => s.team !== null).length}/
            {currentDrawState?.slots.length} Posisi
          </span>
        </div>

        {/* Dynamic responsive grid filling all available width */}
        <div
          className={`grid gap-4 ${
            activeGroupNames.length <= 4
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5'
          }`}
        >
          {activeGroupNames.map((groupName) => {
            const groupSlots = (currentDrawState?.slots || [])
              .filter((s) => s.groupName === groupName)
              .sort((a, b) => a.slotIndex - b.slotIndex);
            const isGroupFull =
              groupSlots.length > 0 && groupSlots.every((s) => s.team !== null);

            return (
              <div
                key={groupName}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-slate-300"
              >
                {/* Compact Card Header */}
                <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white font-mono text-xs font-black flex items-center justify-center shadow-xs">
                      {groupName}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold leading-tight">GRUP {groupName}</h3>
                      <div className="text-[10px] text-slate-400">
                        {groupSlots.length} Tim Peserta
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isGroupFull ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> LENGKAP
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        {groupSlots.filter((s) => s.team !== null).length}/{groupSlots.length}
                      </span>
                    )}

                    {/* Delete extra group button for Liga 4 */}
                    {selectedLeague === 'liga4' &&
                      onRemoveGroupFromLeague4 &&
                      activeGroupNames.length > 5 &&
                      ['F', 'G', 'H', 'I', 'J'].includes(groupName) && (
                        <button
                          onClick={() => onRemoveGroupFromLeague4(groupName)}
                          title={`Hapus Grup ${groupName}`}
                          className="text-slate-400 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                  </div>
                </div>

                {/* Slot Rows List */}
                <div className="p-3 space-y-2 flex-1">
                  {groupSlots.map((slot) => {
                    const isTarget = effectiveTargetSlotCode === slot.code;

                    if (slot.team) {
                      return (
                        <div
                          key={slot.code}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-[#7C3AED] text-white font-mono text-[10px] font-extrabold shrink-0">
                              {slot.code}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {slot.team.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {slot.team.pot ? `POT ${slot.team.pot}` : 'Random All'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            {selectedLeague === 'liga4' &&
                              onRemoveSlot &&
                              slot.slotIndex > 3 && (
                                <button
                                  onClick={() => onRemoveSlot(slot.code)}
                                  className="text-slate-300 hover:text-red-500 p-0.5 cursor-pointer"
                                  title="Hapus Slot Ini"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    }

                    // Empty Slot (Clickable to trigger spin for this slot)
                    return (
                      <button
                        key={slot.code}
                        disabled={isSpinning}
                        onClick={() => {
                          setManualTargetSlotCode(slot.code);
                          setDrawMode('step');
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between ${
                          isTarget
                            ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/60'
                            : 'border-slate-200 hover:border-[#7C3AED]/70 hover:bg-violet-50/40 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-extrabold">
                            {slot.code}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {leagueConfig.hasPots ? `POT ${slot.slotIndex}` : 'Belum Terisi'}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                            isTarget
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-[#7C3AED] bg-violet-100 hover:bg-violet-200'
                          }`}
                        >
                          {isTarget ? 'TARGET AKTIF' : '+ Undi Ini'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Liga 4: Add Team to this specific group */}
                {selectedLeague === 'liga4' && onAddTeamToGroupSlot && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => {
                        setTargetGroupForNewTeam(groupName);
                        setShowAddTeamModal(true);
                      }}
                      disabled={isSpinning}
                      className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>+ Tambah Tim ke Grup {groupName}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CELEBRATION ANNOUNCEMENT MODAL
          ========================================================================= */}
      {announcementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-violet-500 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] text-white flex items-center justify-center mx-auto shadow-lg">
              <Trophy className="w-8 h-8 text-amber-300" />
            </div>

            <div className="mt-4">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#059669] text-xs font-black uppercase tracking-wider font-mono">
                HASIL PENGUNDIAN SPINNER RESMI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {announcementModal.teamName}
              </h2>
              <div className="mt-3 p-3 bg-violet-50 rounded-2xl border border-violet-200 flex items-center justify-center gap-3">
                <span className="font-mono text-sm font-extrabold text-[#7C3AED]">
                  {announcementModal.slotCode}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-800 text-sm">
                  Grup {announcementModal.groupName}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  {announcementModal.potLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => setAnnouncementModal(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] shadow-md transition-colors cursor-pointer"
              >
                Lanjutkan Pengundian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGA 4 ADD TEAM MODAL
          ========================================================================= */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Tim ke Grup {targetGroupForNewTeam}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Liga 4 · Sistem Dinamis MGMP Cup 2026
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamInGroup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Sekolah / Tim
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTeamNameInput}
                  onChange={(e) => setNewTeamNameInput(e.target.value)}
                  placeholder="Contoh: SMPN 3 BULU B"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#059669] focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Grup Target
                </label>
                <select
                  value={targetGroupForNewTeam || ''}
                  onChange={(e) => setTargetGroupForNewTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#059669] focus:bg-white text-slate-900 font-bold"
                >
                  {activeGroupNames.map((g) => (
                    <option key={g} value={g}>
                      Grup {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                Slot baru akan otomatis dibuat di grup terpilih dan diisi langsung dengan nama sekolah ini. Jadwal pertandingan setengah kompetisi akan langsung disesuaikan.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-xs cursor-pointer"
                >
                  Tambahkan ke Grup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
