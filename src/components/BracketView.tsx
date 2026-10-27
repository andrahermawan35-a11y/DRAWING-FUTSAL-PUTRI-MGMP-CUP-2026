import React, { useState } from 'react';
import { GitBranch, Trophy, Shield, Printer, CheckCircle2 } from 'lucide-react';
import { LEAGUES } from '../data/teamsData';
import { LeagueDrawState, LeagueId } from '../types';

interface BracketViewProps {
  drawStates: Record<LeagueId, LeagueDrawState>;
}

type BracketTab = 'liga1_3' | 'liga4';

export const BracketView: React.FC<BracketViewProps> = ({ drawStates }) => {
  const [activeTab, setActiveTab] = useState<BracketTab>('liga1_3');
  const [selectedPreviewLeague, setSelectedPreviewLeague] = useState<LeagueId>('liga1');

  const currentLeagueId: LeagueId = activeTab === 'liga4' ? 'liga4' : selectedPreviewLeague;
  const currentLeague = LEAGUES.find((l) => l.id === currentLeagueId)!;
  const currentDraw = drawStates[currentLeagueId];

  const getGroupTeamsLabel = (groupName: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const slots = currentDraw.slots.filter((s) => s.groupName === groupName && s.team !== null);
    if (slots.length === 0) return `Menunggu Drawing Grup ${groupName}`;
    return slots.map((s) => s.team!.name).join(' / ');
  };

  const leftMatches =
    activeTab === 'liga1_3'
      ? [
          {
            matchNo: 'MATCH 1 (QF 1)',
            homeTitle: 'Juara Grup A',
            homeSub: getGroupTeamsLabel('A'),
            awayTitle: 'Runner-up Grup D',
            awaySub: getGroupTeamsLabel('D'),
          },
          {
            matchNo: 'MATCH 2 (QF 2)',
            homeTitle: 'Juara Grup B',
            homeSub: getGroupTeamsLabel('B'),
            awayTitle: 'Runner-up Grup C',
            awaySub: getGroupTeamsLabel('C'),
          },
        ]
      : [
          {
            matchNo: 'MATCH 1 (QF 1)',
            homeTitle: 'Juara Grup A',
            homeSub: getGroupTeamsLabel('A'),
            awayTitle: 'Runner-up Terbaik 1',
            awaySub: 'Peringkat 1 Klasemen Runner-up Grup A–E',
          },
          {
            matchNo: 'MATCH 2 (QF 2)',
            homeTitle: 'Juara Grup B',
            homeSub: getGroupTeamsLabel('B'),
            awayTitle: 'Runner-up Terbaik 2',
            awaySub: 'Peringkat 2 Klasemen Runner-up Grup A–E',
          },
        ];

  const rightMatches =
    activeTab === 'liga1_3'
      ? [
          {
            matchNo: 'MATCH 3 (QF 3)',
            homeTitle: 'Juara Grup C',
            homeSub: getGroupTeamsLabel('C'),
            awayTitle: 'Runner-up Grup B',
            awaySub: getGroupTeamsLabel('B'),
          },
          {
            matchNo: 'MATCH 4 (QF 4)',
            homeTitle: 'Juara Grup D',
            homeSub: getGroupTeamsLabel('D'),
            awayTitle: 'Runner-up Grup A',
            awaySub: getGroupTeamsLabel('A'),
          },
        ]
      : [
          {
            matchNo: 'MATCH 3 (QF 3)',
            homeTitle: 'Juara Grup C',
            homeSub: getGroupTeamsLabel('C'),
            awayTitle: 'Runner-up Terbaik 3',
            awaySub: 'Peringkat 3 Klasemen Runner-up Grup A–E',
          },
          {
            matchNo: 'MATCH 4 (QF 4)',
            homeTitle: 'Juara Grup D',
            homeSub: getGroupTeamsLabel('D'),
            awayTitle: 'Juara Grup E',
            awaySub: getGroupTeamsLabel('E'),
          },
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-[#6D28D9] uppercase tracking-wider">
            SUBMENU DRAWING B · KNOCKOUT BRACKET RESMI
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Bagan 8 Besar (Perempat Final s/d Grand Final)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi simetris 2 Match Kiri & 2 Match Kanan untuk fase gugur Liga 1–3 (4 Grup) dan Liga 4 (5 Grup).
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak Bagan 8 Besar
        </button>
      </div>

      {/* 2 Submenu KPI Cards */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Submenu KPI 1: Bagan 8 Besar LIGA 1 - 3 */}
        <button
          onClick={() => setActiveTab('liga1_3')}
          className={`text-left p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'liga1_3'
              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#6D28D9]/40'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === 'liga1_3' ? 'text-violet-400' : 'text-[#6D28D9]'
              }`}
            >
              SUBMENU KPI 1 · SKEMA 4 GRUP (A, B, C, D)
            </div>
            <h2 className="text-lg font-extrabold mt-1">Bagan 8 Besar LIGA 1 – 3</h2>
            <p
              className={`text-xs mt-1 ${
                activeTab === 'liga1_3' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Pertemuan silang Juara Grup vs Runner-up Grup (A vs D, B vs C, C vs B, D vs A)
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeTab === 'liga1_3' ? 'bg-[#6D28D9] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <GitBranch className="w-6 h-6" />
          </div>
        </button>

        {/* Submenu KPI 2: Bagan 8 Besar LIGA 4 */}
        <button
          onClick={() => setActiveTab('liga4')}
          className={`text-left p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'liga4'
              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#10B981]/40'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-wider ${
                activeTab === 'liga4' ? 'text-emerald-400' : 'text-[#10B981]'
              }`}
            >
              SUBMENU KPI 2 · SKEMA 5 GRUP (A, B, C, D, E)
            </div>
            <h2 className="text-lg font-extrabold mt-1">Bagan 8 Besar LIGA 4</h2>
            <p
              className={`text-xs mt-1 ${
                activeTab === 'liga4' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              5 Juara Grup (A–E) + 3 Runner-up Terbaik (Match 4: Juara Grup D vs Juara Grup E)
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              activeTab === 'liga4' ? 'bg-[#10B981] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Trophy className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Optional League Switcher when inside Liga 1-3 tab to preview real drawn teams */}
      {activeTab === 'liga1_3' && (
        <div className="no-print bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-700">
            Pratinjau Kandidat Tim Grup Berdasarkan Hasil Drawing:
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['liga1', 'liga2', 'liga3'] as LeagueId[]).map((lid) => (
              <button
                key={lid}
                onClick={() => setSelectedPreviewLeague(lid)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  selectedPreviewLeague === lid
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lid.toUpperCase().replace('LIGA', 'LIGA ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Bracket Canvas: 2 Match Kiri - Semifinal & Final - 2 Match Kanan */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 min-w-[920px]">
          <div>
            <span className="text-xs font-bold text-[#6D28D9] uppercase">
              BAGAN RESMI 8 BESAR · {activeTab === 'liga1_3' ? `${currentLeague.name} (FORMAT LIGA 1–3)` : 'LIGA 4 (FORMAT 5 GRUP)'}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Format 2 Match Kiri & 2 Match Kanan Menuju Final MGMP Cup 2026
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>Sistem Gugur Tunggal (Knockout)</span>
          </div>
        </div>

        <div className="grid grid-cols-11 gap-4 items-center min-w-[960px] py-2">
          {/* LEFT WING: 2 Matches (Match 1 & Match 2) */}
          <div className="col-span-3 space-y-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              BLOK KIRI · PEREMPAT FINAL (8 BESAR)
            </div>
            {leftMatches.map((m, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs relative"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono font-extrabold text-[#6D28D9]">
                    {m.matchNo}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    8 Besar Kiri
                  </span>
                </div>

                {/* Home Slot */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{m.homeTitle}</span>
                    <Shield className="w-3.5 h-3.5 text-[#6D28D9]" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={m.homeSub}>
                    Kandidat: {m.homeSub}
                  </div>
                </div>

                <div className="text-center text-[10px] font-mono font-bold text-slate-400 my-1">
                  VS
                </div>

                {/* Away Slot */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{m.awayTitle}</span>
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={m.awaySub}>
                    Kandidat: {m.awaySub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LEFT SEMIFINAL */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              SEMIFINAL KIRI
            </div>
            <div className="w-full bg-[#0F172A] text-white rounded-xl p-4 border border-slate-800 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-violet-400 mb-2">
                SEMIFINAL 1
              </div>
              <div className="p-2 bg-slate-800/90 rounded border border-slate-700 text-xs font-semibold">
                Pemenang Match 1
              </div>
              <div className="text-center text-[10px] font-mono text-slate-400 my-1.5">VS</div>
              <div className="p-2 bg-slate-800/90 rounded border border-slate-700 text-xs font-semibold">
                Pemenang Match 2
              </div>
            </div>
          </div>

          {/* CENTER GRAND FINAL */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="w-full py-6 px-2 rounded-2xl bg-gradient-to-b from-[#6D28D9] to-[#4C1D95] text-white text-center shadow-md flex flex-col items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-300 mb-2" />
              <div className="text-[10px] font-mono uppercase tracking-wider text-violet-200">
                PUNCAK
              </div>
              <div className="text-xs font-extrabold mt-0.5">FINAL</div>
              <div className="text-[10px] text-violet-200 mt-2">
                SF 1 vs SF 2
              </div>
            </div>
          </div>

          {/* RIGHT SEMIFINAL */}
          <div className="col-span-2 flex flex-col items-center justify-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              SEMIFINAL KANAN
            </div>
            <div className="w-full bg-[#0F172A] text-white rounded-xl p-4 border border-slate-800 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-emerald-400 mb-2">
                SEMIFINAL 2
              </div>
              <div className="p-2 bg-slate-800/90 rounded border border-slate-700 text-xs font-semibold">
                Pemenang Match 3
              </div>
              <div className="text-center text-[10px] font-mono text-slate-400 my-1.5">VS</div>
              <div className="p-2 bg-slate-800/90 rounded border border-slate-700 text-xs font-semibold">
                Pemenang Match 4
              </div>
            </div>
          </div>

          {/* RIGHT WING: 2 Matches (Match 3 & Match 4) */}
          <div className="col-span-3 space-y-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              BLOK KANAN · PEREMPAT FINAL (8 BESAR)
            </div>
            {rightMatches.map((m, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs relative"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono font-extrabold text-[#10B981]">
                    {m.matchNo}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    8 Besar Kanan
                  </span>
                </div>

                {/* Home Slot */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{m.homeTitle}</span>
                    <Shield className="w-3.5 h-3.5 text-[#6D28D9]" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={m.homeSub}>
                    Kandidat: {m.homeSub}
                  </div>
                </div>

                <div className="text-center text-[10px] font-mono font-bold text-slate-400 my-1">
                  VS
                </div>

                {/* Away Slot */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{m.awayTitle}</span>
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={m.awaySub}>
                    Kandidat: {m.awaySub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table of 8 Besar Pairings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Tabel Regulasi Pertemuan Babak 8 Besar ({activeTab === 'liga1_3' ? 'Liga 1, Liga 2, dan Liga 3' : 'Liga 4'})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <th className="py-2.5 pr-4">Partai</th>
                <th className="py-2.5 px-4">Posisi Bagan</th>
                <th className="py-2.5 px-4">Tim Kandang (Home)</th>
                <th className="py-2.5 px-4 text-center">VS</th>
                <th className="py-2.5 px-4">Tim Tandang (Away)</th>
                <th className="py-2.5 pl-4">Jalur Semifinal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...leftMatches, ...rightMatches].map((m, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-mono font-bold text-[#6D28D9]">{m.matchNo}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {i < 2 ? 'Blok Kiri' : 'Blok Kanan'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{m.homeTitle}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">VS</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{m.awayTitle}</td>
                  <td className="py-3 pl-4 font-semibold text-slate-700">
                    {i < 2 ? 'Menuju Semifinal 1 (Kiri)' : 'Menuju Semifinal 2 (Kanan)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
