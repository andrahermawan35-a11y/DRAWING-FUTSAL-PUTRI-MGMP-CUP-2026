import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Disc,
  Shuffle,
  Download,
} from 'lucide-react';
import { INITIAL_LEAGUES, ORDER_OPTIONS } from '../data/teamsData';
import {
  exportScheduleToExcel,
  exportScheduleToPDF,
  exportScheduleToWord,
  generateSchedules,
} from '../utils/exportUtils';
import { ActiveMenu, LeagueConfig, LeagueDrawState, LeagueId, OrderOptionId } from '../types';

interface ScheduleViewProps {
  drawStates: Record<LeagueId, LeagueDrawState>;
  selectedOrder: OrderOptionId | null;
  initialLeagueFilter?: LeagueId | 'all';
  onNavigate: (menu: ActiveMenu, leagueId?: LeagueId) => void;
  leagues?: LeagueConfig[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  drawStates,
  selectedOrder,
  initialLeagueFilter = 'all',
  onNavigate,
  leagues = INITIAL_LEAGUES,
}) => {
  const [leagueFilter, setLeagueFilter] = useState<LeagueId | 'all'>(initialLeagueFilter);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allMatches = useMemo(
    () => generateSchedules(drawStates, selectedOrder, leagues),
    [drawStates, selectedOrder, leagues]
  );

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (leagueFilter !== 'all' && m.leagueId !== leagueFilter) return false;
      if (groupFilter !== 'all' && m.groupName !== groupFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchHome = m.homeTeamName.toLowerCase().includes(q);
        const matchAway = m.awayTeamName.toLowerCase().includes(q);
        const matchCode =
          m.homeCode.toLowerCase().includes(q) || m.awayCode.toLowerCase().includes(q);
        if (!matchHome && !matchAway && !matchCode) return false;
      }
      return true;
    });
  }, [allMatches, leagueFilter, groupFilter, searchQuery]);

  const activeOrderOption = ORDER_OPTIONS[selectedOrder || 'A'];
  const readyMatchesCount = filteredMatches.filter((m) => m.isReady).length;

  // Extract all distinct groups present across matches
  const availableGroups = useMemo(() => {
    const relevantMatches = leagueFilter === 'all'
      ? allMatches
      : allMatches.filter((m) => m.leagueId === leagueFilter);
    return Array.from(new Set(relevantMatches.map((m) => m.groupName))).sort();
  }, [allMatches, leagueFilter]);

  return (
    <div className="space-y-6">
      {/* Official Document Print Header (Visible only when printing) */}
      <div className="hidden print:block print-header-banner">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9pt] font-bold text-[#7C3AED] uppercase tracking-wider">
              MGMP PJOK SMP/MTs KABUPATEN TEMANGGUNG
            </div>
            <h1 className="text-[13pt] font-extrabold text-slate-900 leading-tight">
              JADWAL PERTANDINGAN FASE GRUP FUTSAL PUTRI MGMP CUP 2026
            </h1>
            <div className="text-[8pt] text-slate-600 mt-0.5">
              Sistem Setengah Kompetisi · Skema Urutan: <strong>{activeOrderOption.label} ({activeOrderOption.sequenceText})</strong>
              {leagueFilter !== 'all' ? ` · Divisi: ${leagueFilter.toUpperCase()}` : ' · Semua Divisi Liga'}
            </div>
          </div>
          <div className="text-right text-[8pt] text-slate-600 font-mono">
            <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div>Total: {filteredMatches.length} Pertandingan</div>
          </div>
        </div>
      </div>

      {/* Header & Export Actions (Screen View) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            GENERATOR JADWAL RESMI · SISTEM SETENGAH KOMPETISI
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Jadwal Pertandingan Fase Grup — Futsal Putri MGMP Cup 2026
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tergenerasi otomatis dari hasil pengundian grup & opsi urutan pertandingan. Unduh jadwal dalam format tabel rapi (PDF, Excel, dan Word).
          </p>
        </div>

        {/* SOLID VIBRANT DOWNLOAD BUTTONS (PDF, EXCEL, WORD) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => exportScheduleToPDF(filteredMatches, leagueFilter, selectedOrder)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#EF4444] hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Download Jadwal Pertandingan format PDF"
          >
            <FileText className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => exportScheduleToExcel(filteredMatches, leagueFilter, selectedOrder)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#059669] hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Download Jadwal Pertandingan format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel (.xlsx)
          </button>
          <button
            onClick={() => exportScheduleToWord(filteredMatches, leagueFilter, selectedOrder)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Download Jadwal Pertandingan format Word (.doc)"
          >
            <FileDown className="w-4 h-4" />
            Download Word (.doc)
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      </div>

      {/* Solid & Bright KPI Cards for Match Schedules */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Urutan Pertandingan */}
        <div className="bg-[#7C3AED] text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-violet-200 uppercase tracking-wider">
              RUMUS URUTAN PERTANDINGAN
            </div>
            <div className="text-xl font-black mt-1 flex items-center gap-2">
              <span>{activeOrderOption.label}</span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                ({activeOrderOption.sequenceText})
              </span>
            </div>
            <div className="text-[11px] text-violet-100 mt-1">
              {selectedOrder
                ? 'Hasil resmi dari Spinner Urutan'
                : 'Default Opsi A (1v2, 1v3, 2v3)'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('drawing-order')}
            className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Disc className="w-3.5 h-3.5" />
            Ganti Opsi
          </button>
        </div>

        {/* KPI 2: Total Partai Tampil */}
        <div className="bg-[#2563EB] text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider">
              TOTAL PARTAI DITAMPILKAN
            </div>
            <div className="text-2xl font-black font-mono tabular-nums mt-1">
              {filteredMatches.length} Pertandingan
            </div>
            <div className="text-[11px] text-blue-100 mt-1">
              Filter: {leagueFilter === 'all' ? 'Semua Divisi Liga' : leagueFilter.toUpperCase()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* KPI 3: Kesiapan Tim */}
        <div
          className={`rounded-xl p-5 shadow-sm flex items-center justify-between text-white ${
            readyMatchesCount === filteredMatches.length && filteredMatches.length > 0
              ? 'bg-[#059669]'
              : 'bg-[#EA580C]'
          }`}
        >
          <div>
            <div className="text-[11px] font-extrabold text-white/90 uppercase tracking-wider">
              STATUS KESIAPAN TIM
            </div>
            <div className="text-2xl font-black font-mono tabular-nums mt-1">
              {readyMatchesCount} / {filteredMatches.length} Siap
            </div>
            <div className="text-[11px] text-white/95 mt-1">
              {readyMatchesCount === filteredMatches.length
                ? 'Seluruh nama sekolah telah terundi'
                : 'Lakukan drawing grup untuk mengisi nama tim'}
            </div>
          </div>
          <button
            onClick={() =>
              onNavigate('drawing-groups', leagueFilter === 'all' ? 'liga1' : leagueFilter)
            }
            className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Drawing Grup
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* League Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setLeagueFilter('all');
              setGroupFilter('all');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              leagueFilter === 'all'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Liga ({allMatches.length} Partai)
          </button>
          {leagues.map((l) => {
            const countForL = allMatches.filter((m) => m.leagueId === l.id).length;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setLeagueFilter(l.id);
                  setGroupFilter('all');
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  leagueFilter === l.id
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.name} ({countForL})
              </button>
            );
          })}
        </div>

        {/* Group Filter + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                groupFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Grup
            </button>
            {availableGroups.map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                  groupFilter === g
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grup {g}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tim atau kode (A.1)..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7C3AED] w-48"
            />
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4 w-28">Divisi Liga</th>
                <th className="py-3.5 px-4 w-28">Grup</th>
                <th className="py-3.5 px-4 w-32">Urutan Partai</th>
                <th className="py-3.5 px-4 text-right">Tim Kandang (Home)</th>
                <th className="py-3.5 px-3 text-center w-16">VS</th>
                <th className="py-3.5 px-4">Tim Tandang (Away)</th>
                <th className="py-3.5 px-4 text-right w-36">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan jadwal pertandingan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 tabular-nums">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{m.leagueName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#7C3AED]">
                        GRUP {m.groupName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums">
                      Partai Grup Ke-{m.matchInGroup}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span
                          className={`font-bold ${
                            m.isReady ? 'text-slate-900' : 'text-slate-400 italic'
                          }`}
                        >
                          {m.homeTeamName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-[#7C3AED] font-mono text-[11px] font-bold">
                          {m.homeCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-extrabold">
                        VS
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#059669] font-mono text-[11px] font-bold">
                          {m.awayCode}
                        </span>
                        <span
                          className={`font-bold ${
                            m.isReady ? 'text-slate-900' : 'text-slate-400 italic'
                          }`}
                        >
                          {m.awayTeamName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.isReady ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#059669]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Siap Main
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[#EF4444]">
                          <AlertCircle className="w-3.5 h-3.5" /> Belum Undi
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
