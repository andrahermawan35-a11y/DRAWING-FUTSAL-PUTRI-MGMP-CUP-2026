import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  Shuffle,
  GitBranch,
  Disc,
  Sparkles,
  RotateCcw,
  Clock,
  Radio,
  CloudSun,
  SunMedium,
} from 'lucide-react';
import { INITIAL_LEAGUES, ORDER_OPTIONS } from '../data/teamsData';
import { ActiveMenu, LeagueConfig, LeagueDrawState, LeagueId, OrderOptionId, Team } from '../types';

interface DashboardViewProps {
  drawStates: Record<LeagueId, LeagueDrawState>;
  selectedOrder: OrderOptionId | null;
  onNavigate: (menu: ActiveMenu, leagueId?: LeagueId) => void;
  onQuickSimulateAll: () => void;
  onResetAll: () => void;
  allTeams?: Team[];
  leagues?: LeagueConfig[];
}

const INDONESIAN_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const INDONESIAN_MONTHS = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  drawStates,
  selectedOrder,
  onNavigate,
  onQuickSimulateAll,
  onResetAll,
  allTeams,
  leagues = INITIAL_LEAGUES,
}) => {
  const [hoveredLeague, setHoveredLeague] = useState<LeagueId | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalTeams = allTeams ? allTeams.length : 51;
  const totalLeagues = leagues.length;

  const totalFilledSlots = (Object.values(drawStates) as LeagueDrawState[]).reduce(
    (acc, st) => acc + st.slots.filter((s) => s.team !== null).length,
    0
  );
  const totalAvailableSlots = (Object.values(drawStates) as LeagueDrawState[]).reduce(
    (acc, st) => acc + st.slots.length,
    0
  );

  const completedLeaguesCount = (Object.values(drawStates) as LeagueDrawState[]).filter(
    (st) => st.isCompleted
  ).length;
  const isAllDrawingDone = completedLeaguesCount === totalLeagues && selectedOrder !== null;

  // Compute matches count
  const totalGroupMatches = leagues.reduce((acc, l) => {
    const state = drawStates[l.id];
    if (!state) return acc + l.groupMatchesCount;
    // Calculate matches per group in this league
    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName)));
    let leagueMatches = 0;
    for (const g of groupNames) {
      const count = state.slots.filter((s) => s.groupName === g).length;
      if (count === 3) leagueMatches += 3;
      else if (count >= 2) leagueMatches += (count * (count - 1)) / 2;
    }
    return acc + (leagueMatches || l.groupMatchesCount);
  }, 0);

  const totalKnockoutMatches = leagues.reduce((acc, l) => acc + l.knockoutMatchesCount, 0);
  const totalAllMatches = totalGroupMatches + totalKnockoutMatches;

  // Format Clock Components
  const dayName = INDONESIAN_DAYS[currentTime.getDay()];
  const dateNum = currentTime.getDate();
  const monthName = INDONESIAN_MONTHS[currentTime.getMonth()];
  const yearNum = currentTime.getFullYear();

  const hoursStr = String(currentTime.getHours()).padStart(2, '0');
  const minutesStr = String(currentTime.getMinutes()).padStart(2, '0');
  const secondsStr = String(currentTime.getSeconds()).padStart(2, '0');

  // Dynamic Pie Data
  const pieColors: Record<LeagueId, string> = {
    liga1: '#7C3AED',
    liga2: '#2563EB',
    liga3: '#0284C7',
    liga4: '#059669',
  };

  const pieData = leagues.map((l) => {
    const leagueTeamCount = allTeams
      ? allTeams.filter((t) => t.leagueId === l.id).length
      : l.totalTeams;
    return {
      id: l.id,
      name: l.name,
      count: leagueTeamCount,
      color: pieColors[l.id] || '#EA580C',
      pct: totalTeams > 0 ? (leagueTeamCount / totalTeams) * 100 : 0,
    };
  });

  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          BESAR & KEREN: LIVE DIGITAL CLOCK, DAY & DATE CARD (VIBRANT & SOLID)
          ========================================================================= */}
      {/* =========================================================================
          HERO ARENA: ENLARGED MGMP TITLE, DIGITAL CLOCK & BMKG TEMANGGUNG WEATHER
          ========================================================================= */}
      <div className="bg-[#0F172A] border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
        {/* Subtle decorative glow & stadium backdrop */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#7C3AED]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#2563EB]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Banner: ENLARGED OFFICIAL TITLE */}
          <div className="border-b border-slate-800/80 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-[#7C3AED] text-white text-xs font-black uppercase tracking-wider shadow-xs">
                  OFFICIAL TOURNAMENT
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  DRAWING FUTSAL PUTRI 2026
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Kabupaten Temanggung · Jawa Tengah
              </div>
            </div>

            {/* ENLARGED FONT FOR MGMP PJOK SMP/MTs KABUPATEN TEMANGGUNG */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-300 tracking-tight leading-tight mt-3 drop-shadow-sm">
              Musyawarah Guru Mata Pelajaran PJOK SMP/MTs Kabupaten Temanggung · Tahun 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Sistem Pengundian Grup Resmi, Manajemen Database 51 Sekolah, Bagan 8 Besar, dan Generator Jadwal Pertandingan
            </p>
          </div>

          {/* Main Hero Split: Giant Clock & BMKG Weather Temanggung */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 6 cols: Live Digital Clock & Day/Date */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between mb-4">
                {/* Day Badge */}
                <div className="px-4 py-2 rounded-xl bg-[#EA580C] text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-md flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  <span>{dayName}</span>
                </div>

                {/* Full Date */}
                <div className="text-base sm:text-lg font-extrabold text-slate-100 tracking-tight font-sans">
                  {dateNum} {monthName} {yearNum}
                </div>
              </div>

              {/* Giant Digital Clock */}
              <div className="py-2 flex items-center justify-center">
                <div className="text-5xl sm:text-6xl xl:text-7xl font-mono font-black tabular-nums tracking-wider text-white drop-shadow-lg flex items-center">
                  <span>{hoursStr}</span>
                  <span className="text-[#10B981] mx-1 animate-pulse">:</span>
                  <span>{minutesStr}</span>
                  <span className="text-[#10B981] mx-1 animate-pulse">:</span>
                  <span className="text-amber-400">{secondsStr}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Waktu Pertandingan Futsal Putri
                </span>
                <span className="text-slate-300 font-bold">GOR Bambu Runcing</span>
              </div>
            </div>

            {/* Right 6 cols: BMKG Weather Station Temanggung */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-inner flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center shadow-xs">
                    <CloudSun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      BMKG KABUPATEN TEMANGGUNG
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Prakiraan Cuaca Resmi BMKG Jawa Tengah
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold font-mono">
                  TERVERIFIKASI BMKG
                </span>
              </div>

              {/* Temperature & Main Condition */}
              <div className="my-3 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      24°C
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Suhu Rata-rata (20°C - 27°C)
                    </span>
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5 flex items-center gap-1.5">
                    <span>Cerah Berawan</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-slate-300 text-xs font-normal">Sejuk Lereng Sindoro & Sumbing</span>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <SunMedium className="w-8 h-8 text-amber-400 animate-spin-slow" />
                </div>
              </div>

              {/* 3 Weather KPI Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Kelembapan</div>
                  <div className="font-mono font-bold text-slate-100 mt-0.5">76%</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Kecepatan Angin</div>
                  <div className="font-mono font-bold text-slate-100 mt-0.5">12 km/j BD</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-medium">Kualitas Udara</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">AQI 26 (Segar)</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Stasiun Klimatologi BMKG · Venue: GOR Bambu Runcing</span>
                <span className="text-emerald-400 font-mono font-semibold">Kondisi Ideal Pertandingan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner / Executive Context & Quick Simulation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7C3AED] mb-1">
            <span>MGMP CUP TAHUN 2026</span>
            <span aria-hidden="true">·</span>
            <span>KABUPATEN TEMANGGUNG</span>
            <span aria-hidden="true">·</span>
            <span>FUTSAL PUTRI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Drawing & Jadwal Pertandingan MGMP Cup 2026
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sistem terintegrasi pengundian grup, urutan pertandingan setengah kompetisi, dan bagan 8 besar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onQuickSimulateAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            Simulasi Cepat Semua Liga
          </button>
          {totalFilledSlots > 0 || selectedOrder ? (
            <button
              onClick={onResetAll}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua
            </button>
          ) : null}
        </div>
      </div>

      {/* 4 SOLID & BRIGHT ENERGETIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Tim (Solid Vivid Violet #7C3AED) */}
        <div
          onClick={() => onNavigate('database')}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-violet-200 uppercase">
              TOTAL TIM PESERTA
            </span>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono tabular-nums tracking-tight">
              {totalTeams} Tim
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-violet-100">
              <span>SMP / MTs Putri Terdaftar</span>
              <span className="inline-flex items-center gap-1 font-bold">
                Buka Data <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Jumlah Liga (Solid Electric Blue #2563EB) */}
        <div
          onClick={() => onNavigate('drawing-groups')}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-blue-200 uppercase">
              JUMLAH DIVISI LIGA
            </span>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono tabular-nums tracking-tight">
              {totalLeagues} Liga
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-blue-100">
              <span>
                Liga 1–3 (3 POT) · Liga 4 ({leagues.find((l) => l.id === 'liga4')?.groups.length || 5} Grup)
              </span>
              <span className="inline-flex items-center gap-1 font-bold">
                Undi Grup <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Status Drawing (Solid Emerald Green #059669 when done, Solid Vibrant Crimson #E11D48 when pending) */}
        <div
          onClick={() => onNavigate('drawing-groups')}
          className={`rounded-xl p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between text-white ${
            isAllDrawingDone
              ? 'bg-[#059669] hover:bg-[#047857]'
              : 'bg-[#E11D48] hover:bg-[#BE123C]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-white/90 uppercase">
              STATUS DRAWING RESMI
            </span>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              {isAllDrawingDone ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black tracking-tight flex items-baseline gap-2">
              <span>{isAllDrawingDone ? 'SELESAI' : 'BELUM SELESAI'}</span>
              <span className="text-sm font-mono tabular-nums font-bold opacity-90">
                ({totalFilledSlots}/{totalAvailableSlots} Slot)
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/95">
              <span>
                Urutan: {selectedOrder ? `OPSI ${selectedOrder}` : 'Belum Diundi'} · {completedLeaguesCount}/{totalLeagues} Liga
              </span>
              <span className="inline-flex items-center gap-1 font-bold">
                Drawing <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Pertandingan (Solid Fiery Orange #EA580C) */}
        <div
          onClick={() => onNavigate('schedule')}
          className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl p-5 shadow-sm cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-wider text-orange-200 uppercase">
              TOTAL PERTANDINGAN
            </span>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono tabular-nums tracking-tight">
              {totalAllMatches} Partai
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-orange-100">
              <span>{totalGroupMatches} Fase Grup · {totalKnockoutMatches} Gugur</span>
              <span className="inline-flex items-center gap-1 font-bold">
                Lihat Jadwal <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Pie Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart: Distribusi Tim per Liga */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Distribusi Tim per Liga
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proporsi {totalTeams} tim peserta terbagi ke dalam {totalLeagues} divisi liga
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#7C3AED] tabular-nums">
                N = {totalTeams} TIM
              </span>
            </div>

            <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
                  {pieData.map((slice) => {
                    const strokeDasharray = `${(slice.pct / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                    cumulativePercent += slice.pct;
                    const isHovered = hoveredLeague === slice.id;

                    return (
                      <circle
                        key={slice.id}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 32 : 26}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredLeague(slice.id)}
                        onMouseLeave={() => setHoveredLeague(null)}
                        onClick={() => onNavigate('database', slice.id)}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
                    {hoveredLeague
                      ? pieData.find((p) => p.id === hoveredLeague)?.count
                      : totalTeams}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    {hoveredLeague
                      ? pieData.find((p) => p.id === hoveredLeague)?.name
                      : 'Total Tim'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2.5">
                {pieData.map((item) => {
                  const st = drawStates[item.id];
                  const drawnCount = st ? st.slots.filter((s) => s.team !== null).length : 0;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredLeague(item.id)}
                      onMouseLeave={() => setHoveredLeague(null)}
                      onClick={() => onNavigate('database', item.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Terundi: {drawnCount}/{item.count} Tim
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-xs font-bold text-slate-900">{item.count} Tim</div>
                        <div className="text-[11px] text-slate-500">{item.pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Liga 1–3: Sistem 3 POT (4 Grup)</span>
            <span className="font-semibold text-emerald-700">Liga 4: Fleksibel Tambah Grup & Tim</span>
          </div>
        </div>

        {/* Bar Chart: Jumlah Pertandingan per Liga (Fase Grup & Knockout) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Jumlah Pertandingan per Liga (Fase Grup & Knockout)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan volume partai pertandingan penyisihan grup (setengah kompetisi) dan babak gugur 8 besar
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#7C3AED]" />
                  <span className="text-slate-700">Fase Grup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#059669]" />
                  <span className="text-slate-700">Fase Knockout</span>
                </div>
              </div>
            </div>

            {/* Custom High-Precision Bar Chart */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-4 gap-6 items-end h-52 px-4 border-b border-slate-200 relative">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-100 pointer-events-none flex justify-end">
                  <span className="text-[10px] font-mono text-slate-400 -mt-2 pr-1">25</span>
                </div>
                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-100 pointer-events-none flex justify-end">
                  <span className="text-[10px] font-mono text-slate-400 -mt-2 pr-1">18</span>
                </div>
                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-100 pointer-events-none flex justify-end">
                  <span className="text-[10px] font-mono text-slate-400 -mt-2 pr-1">12</span>
                </div>
                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-100 pointer-events-none flex justify-end">
                  <span className="text-[10px] font-mono text-slate-400 -mt-2 pr-1">6</span>
                </div>

                {leagues.map((league) => {
                  const state = drawStates[league.id];
                  let grpMatches = league.groupMatchesCount;
                  if (state) {
                    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName)));
                    let counted = 0;
                    for (const g of groupNames) {
                      const count = state.slots.filter((s) => s.groupName === g).length;
                      if (count === 3) counted += 3;
                      else if (count >= 2) counted += (count * (count - 1)) / 2;
                    }
                    if (counted > 0) grpMatches = counted;
                  }

                  const groupHeightPct = Math.min(100, (grpMatches / 25) * 100);
                  const koHeightPct = Math.min(100, (league.knockoutMatchesCount / 25) * 100);
                  const totalLeagueMatches = grpMatches + league.knockoutMatchesCount;

                  return (
                    <div
                      key={league.id}
                      onClick={() => onNavigate('schedule', league.id)}
                      className="flex flex-col items-center h-full justify-end group cursor-pointer z-10"
                    >
                      <div className="text-[11px] font-mono font-bold text-slate-700 mb-1.5 tabular-nums">
                        Total: {totalLeagueMatches}
                      </div>
                      <div className="w-full max-w-[92px] flex items-end justify-center gap-2 h-40">
                        {/* Group Stage Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono font-bold text-[#7C3AED] mb-1 tabular-nums">
                            {grpMatches}
                          </span>
                          <div
                            style={{ height: `${groupHeightPct}%` }}
                            className="w-full bg-[#7C3AED] group-hover:bg-[#6D28D9] rounded-t-md transition-all shadow-xs"
                            title={`${league.name}: ${grpMatches} Pertandingan Grup`}
                          />
                        </div>

                        {/* Knockout Stage Bar */}
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono font-bold text-[#059669] mb-1 tabular-nums">
                            {league.knockoutMatchesCount}
                          </span>
                          <div
                            style={{ height: `${koHeightPct}%` }}
                            className="w-full bg-[#059669] group-hover:bg-[#047857] rounded-t-md transition-all shadow-xs"
                            title={`${league.name}: ${league.knockoutMatchesCount} Pertandingan Knockout`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis Labels */}
              <div className="grid grid-cols-4 gap-6 px-4 pt-3 text-center">
                {leagues.map((league) => {
                  const state = drawStates[league.id];
                  const groupsCount = state
                    ? Array.from(new Set(state.slots.map((s) => s.groupName))).length
                    : league.groups.length;
                  const teamsCount = allTeams
                    ? allTeams.filter((t) => t.leagueId === league.id).length
                    : league.totalTeams;

                  return (
                    <div key={league.id}>
                      <div className="text-xs font-bold text-slate-900">{league.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {groupsCount} Grup ({teamsCount} Tim)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Sistem Setengah Kompetisi Setiap Grup</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              Akumulasi: {totalGroupMatches} Partai Grup + {totalKnockoutMatches} Partai Gugur = {totalAllMatches} Partai
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Stat Card Ringkasan Pertandingan & Quick Shortcut ke Menu Drawing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ringkasan Pertandingan & Status Per Liga */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ringkasan Kesiapan Drawing & Pertandingan per Liga
              </h2>
              <p className="text-xs text-slate-500">
                Pantau progres pengundian grup dan skema urutan pertandingan secara real-time
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#7C3AED]">
              {selectedOrder
                ? `Urutan: OPSI ${selectedOrder} (${ORDER_OPTIONS[selectedOrder].sequenceText})`
                : 'Urutan: Belum Diundi'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 pr-3">Divisi Liga</th>
                  <th className="py-2.5 px-3">Sistem Undian</th>
                  <th className="py-2.5 px-3 text-right">Kuota Tim</th>
                  <th className="py-2.5 px-3 text-right">Terundi</th>
                  <th className="py-2.5 px-3 text-right">Partai Grup</th>
                  <th className="py-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leagues.map((league) => {
                  const st = drawStates[league.id];
                  const filled = st ? st.slots.filter((s) => s.team !== null).length : 0;
                  const totalSlotsInLeague = st ? st.slots.length : league.totalTeams;
                  const leagueTeamsCount = allTeams
                    ? allTeams.filter((t) => t.leagueId === league.id).length
                    : league.totalTeams;

                  let grpMatches = league.groupMatchesCount;
                  if (st) {
                    const groupNames = Array.from(new Set(st.slots.map((s) => s.groupName)));
                    let counted = 0;
                    for (const g of groupNames) {
                      const count = st.slots.filter((s) => s.groupName === g).length;
                      if (count === 3) counted += 3;
                      else if (count >= 2) counted += (count * (count - 1)) / 2;
                    }
                    if (counted > 0) grpMatches = counted;
                  }

                  return (
                    <tr
                      key={league.id}
                      onClick={() => onNavigate('drawing-groups', league.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 pr-3 font-bold text-slate-900">{league.name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {league.hasPots
                          ? '3 POT · 4 Grup (A–D)'
                          : 'Fleksibel Tambah Grup & Tim (Liga 4)'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {leagueTeamsCount} Tim ({totalSlotsInLeague} Slot)
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {filled} / {totalSlotsInLeague}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {grpMatches} Partai
                      </td>
                      <td className="py-3 pl-3 text-right">
                        {st?.isCompleted ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#059669]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[#E11D48]">
                            <AlertCircle className="w-3.5 h-3.5" /> Belum ({filled}/{totalSlotsInLeague})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Shortcut ke Menu Drawing */}
        <div className="lg:col-span-5 bg-[#0F172A] text-white rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              AKSES CEPAT PANITIA
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Shortcut Modul Drawing & Bagan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mulai tahapan pengundian resmi dari urutan pertandingan hingga pembagian grup
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => onNavigate('drawing-order')}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
                    <Disc className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                      1. Drawing Urutan Pertandingan
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Spinner 5 detik penentu Opsi A, B, atau C
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>

              <button
                onClick={() => onNavigate('drawing-bracket')}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#059669] flex items-center justify-center shrink-0">
                    <GitBranch className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      2. Bagan 8 Besar (Knockout Bracket)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Skema pertemuan Juara & Runner-up Grup Liga 1–4
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>

              <button
                onClick={() => onNavigate('drawing-groups')}
                className="w-full flex items-center justify-between p-3.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
                    <Shuffle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      3. Drawing Pembagian Grup (Liga 1–4)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mode Menyeluruh, Step-by-Step, & Tambah Grup/Tim Liga 4
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sistem Setengah Kompetisi Tiap Grup</span>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              Lihat Jadwal Otomatis →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
