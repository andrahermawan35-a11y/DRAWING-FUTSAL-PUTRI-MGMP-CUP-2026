import React, { useState } from 'react';
import { Search, Users, Layers, Shuffle, ArrowRight, CheckCircle2, UserPlus, X, PlusCircle } from 'lucide-react';
import { INITIAL_TEAMS, INITIAL_LEAGUES } from '../data/teamsData';
import { ActiveMenu, LeagueConfig, LeagueDrawState, LeagueId, Team } from '../types';

interface DatabaseTimViewProps {
  selectedLeague: LeagueId;
  onSelectLeague: (league: LeagueId) => void;
  drawStates: Record<LeagueId, LeagueDrawState>;
  onNavigate: (menu: ActiveMenu, leagueId?: LeagueId) => void;
  allTeams?: Team[];
  leagues?: LeagueConfig[];
  onAddTeamToRoster?: (name: string, leagueId: LeagueId) => void;
}

export const DatabaseTimView: React.FC<DatabaseTimViewProps> = ({
  selectedLeague,
  onSelectLeague,
  drawStates,
  onNavigate,
  allTeams = INITIAL_TEAMS,
  leagues = INITIAL_LEAGUES,
  onAddTeamToRoster,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const activeLeagueConfig =
    leagues.find((l) => l.id === selectedLeague) ||
    INITIAL_LEAGUES.find((l) => l.id === selectedLeague)!;
  const leagueTeams = allTeams.filter((t) => t.leagueId === selectedLeague);
  const filteredTeams = leagueTeams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Map team IDs to their drawn group code if already drawn
  const currentDrawState = drawStates[selectedLeague];
  const teamAssignedSlotMap = new Map<string, string>();
  if (currentDrawState?.slots) {
    currentDrawState.slots.forEach((slot) => {
      if (slot.team) {
        teamAssignedSlotMap.set(slot.team.id, slot.code);
      }
    });
  }

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    if (onAddTeamToRoster) {
      onAddTeamToRoster(trimmed, selectedLeague);
    }
    setNewTeamName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">
            MASTER DATA PESERTA RESMI
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Database Tim Peserta — Futsal Putri MGMP Cup 2026
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pilih salah satu dari 4 KPI Card Liga di bawah untuk melihat pembagian POT dan daftar sekolah peserta. Total saat ini: {allTeams.length} Tim.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari sekolah di ${activeLeagueConfig.name}...`}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#7C3AED] focus:bg-white w-60 text-slate-900"
            />
          </div>

          {selectedLeague === 'liga4' && onAddTeamToRoster && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tim Baru Liga 4</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('drawing-groups', selectedLeague)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <span>Undi {activeLeagueConfig.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Large KPI Cards to Select League */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {leagues.map((league) => {
          const isSelected = league.id === selectedLeague;
          const st = drawStates[league.id];
          const drawnCount = st?.slots ? st.slots.filter((s) => s.team !== null).length : 0;
          const currentCount = allTeams.filter((t) => t.leagueId === league.id).length;

          return (
            <button
              key={league.id}
              onClick={() => onSelectLeague(league.id)}
              className={`text-left rounded-xl p-5 transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#7C3AED]/50'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isSelected ? 'text-violet-400' : 'text-[#7C3AED]'
                  }`}
                >
                  {league.hasPots ? 'SISTEM 3 POT UNGGULAN' : 'TANPA POT · RANDOM ALL'}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {league.hasPots ? (
                    <Layers className="w-4 h-4" />
                  ) : (
                    <Shuffle className="w-4 h-4" />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold tracking-tight">{league.name}</span>
                  <span
                    className={`text-lg font-mono font-bold tabular-nums ${
                      isSelected ? 'text-emerald-400' : 'text-slate-700'
                    }`}
                  >
                    {currentCount} Tim
                  </span>
                </div>

                <div
                  className={`mt-2 pt-2.5 border-t text-xs flex items-center justify-between ${
                    isSelected
                      ? 'border-slate-800 text-slate-300'
                      : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span>
                    {league.groups.length} Grup (Grup A–{league.groups[league.groups.length - 1]})
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    Terundi: {drawnCount}/{st?.slots?.length || currentCount}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Master-Detail View of Selected League */}
      {activeLeagueConfig.hasPots ? (
        /* LIGA 1, 2, 3: 3 POT Columns */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {([1, 2, 3] as const).map((potNum) => {
            const potTeams = filteredTeams.filter((t) => t.pot === potNum);
            return (
              <div
                key={potNum}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col"
              >
                <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">
                      {activeLeagueConfig.name} · KATEGORI UNGGULAN
                    </div>
                    <h3 className="text-base font-bold mt-0.5">POT {potNum}</h3>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-sm font-bold text-white">{potTeams.length} Tim</span>
                    <div className="text-[11px] text-slate-400">
                      Mengisi Posisi A.{potNum} – D.{potNum}
                    </div>
                  </div>
                </div>

                <div className="p-4 divide-y divide-slate-100 flex-1">
                  {potTeams.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Tidak ada tim yang cocok dengan pencarian di POT {potNum}.
                    </div>
                  ) : (
                    potTeams.map((team) => {
                      const assignedCode = teamAssignedSlotMap.get(team.id);
                      return (
                        <div
                          key={team.id}
                          className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center">
                              {team.number}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {team.name}
                            </span>
                          </div>

                          <div>
                            {assignedCode ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-[#059669] text-xs font-mono font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {assignedCode}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">
                                Siap Undi
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Aturan: Dilarang 1 grup sesama POT {potNum}</span>
                  <span className="font-mono font-semibold text-slate-700">1 Tim / Grup</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIGA 4: Dynamic Teams - Tanpa POT, Random All */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-[#0F172A] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                LIGA 4 · SISTEM ACAK PENUH (TANPA POT / RANDOM ALL)
              </div>
              <h3 className="text-base font-bold mt-0.5">
                Daftar {leagueTeams.length} Tim Peserta Liga 4 (Terbagi ke {activeLeagueConfig.groups.length} Grup A–{activeLeagueConfig.groups[activeLeagueConfig.groups.length - 1]})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {onAddTeamToRoster && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Tambah Tim Liga 4
                </button>
              )}
              <div className="flex items-center gap-1.5 text-slate-300 font-mono tabular-nums">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{filteredTeams.length} dari {leagueTeams.length} Tim</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredTeams.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                Tidak ditemukan nama sekolah yang sesuai dengan kata kunci pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTeams.map((team) => {
                  const assignedCode = teamAssignedSlotMap.get(team.id);
                  return (
                    <div
                      key={team.id}
                      className="p-3.5 rounded-lg border border-slate-200 hover:border-[#7C3AED] bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                          {team.number}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {team.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Liga 4 · Random All (Tanpa POT)
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {assignedCode ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-[#059669]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {assignedCode}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">Siap Undi</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              Aturan Liga 4: Tim diundi secara acak murni ke seluruh grup ({activeLeagueConfig.groups.join(', ')}). Anda juga dapat menambah grup dan tim secara bebas.
            </span>
            <button
              onClick={() => onNavigate('drawing-groups', 'liga4')}
              className="font-bold text-[#7C3AED] hover:underline cursor-pointer"
            >
              Lanjut ke Drawing Grup Liga 4 →
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah Tim Baru Liga 4 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tambah Tim Baru ke Liga 4
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Registrasi peserta baru MGMP Cup 2026
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Sekolah / Tim
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Contoh: SMPN 3 CANDIROTO B"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#059669] focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                Tim baru akan ditambahkan ke database Liga 4 dan siap diundi baik lewat menu Drawing Grup maupun dimasukkan langsung ke grup yang diinginkan.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Tim Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
