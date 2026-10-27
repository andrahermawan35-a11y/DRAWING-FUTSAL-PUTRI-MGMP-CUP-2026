import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Disc, Play, CheckCircle2, RotateCcw, Calendar, ShieldCheck, X } from 'lucide-react';
import { ORDER_OPTIONS } from '../data/teamsData';
import { ActiveMenu, OrderOptionId } from '../types';

interface DrawingOrderViewProps {
  selectedOrder: OrderOptionId | null;
  onSelectOrder: (option: OrderOptionId | null) => void;
  onNavigate: (menu: ActiveMenu) => void;
}

export const DrawingOrderView: React.FC<DrawingOrderViewProps> = ({
  selectedOrder,
  onSelectOrder,
  onNavigate,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number>(5.0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [livePreviewOption, setLivePreviewOption] = useState<OrderOptionId>('A');
  const [modalResult, setModalResult] = useState<OrderOptionId | null>(null);

  const timerRef = useRef<number | null>(null);
  const previewIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
    };
  }, []);

  const handleStartSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setModalResult(null);
    setCountdown(5.0);

    // Pick winner uniformly among A, B, C
    const options: OrderOptionId[] = ['A', 'B', 'C'];
    const winner = options[Math.floor(Math.random() * options.length)];

    // Calculate target rotation so the wheel spins for 5 seconds (at least 8 full rotations)
    // Sector angles: A = 0..120 (center 60), B = 120..240 (center 180), C = 240..360 (center 300)
    // Pointer is at top (0 deg). To land sector center at top (0 deg):
    const targetSectorAngle = winner === 'A' ? 300 : winner === 'B' ? 180 : 60;
    const baseSpins = 360 * 10;
    const currentBase = rotationDeg - (rotationDeg % 360);
    const nextRotation = currentBase + baseSpins + targetSectorAngle;
    setRotationDeg(nextRotation);

    const startTime = performance.now();
    const duration = 5000; // 5 seconds exact

    let cycleIdx = 0;
    previewIntervalRef.current = window.setInterval(() => {
      cycleIdx = (cycleIdx + 1) % 3;
      setLivePreviewOption(options[cycleIdx]);
    }, 90);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setCountdown(remaining);

      if (elapsed >= duration) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
        setIsSpinning(false);
        setCountdown(0);
        setLivePreviewOption(winner);
        onSelectOrder(winner);
        setModalResult(winner);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore confetti errors in restricted environments
        }
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-[#6D28D9] uppercase tracking-wider">
            SUBMENU DRAWING A · SISTEM 3 TIM PER GRUP
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Drawing Urutan Pertandingan Fase Grup
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Putar spinner selama 5 detik untuk menetapkan rumus urutan pertandingan resmi (Opsi A, Opsi B, atau Opsi C) yang berlaku pada jadwal fase grup.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {selectedOrder && !isSpinning && (
            <button
              onClick={() => onSelectOrder(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Pilihan
            </button>
          )}
          <button
            onClick={() => onNavigate('schedule')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Lihat Jadwal Terbentuk
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = 3 Option Cards, Right = Interactive 3D/Visual Spinner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 3 Option Cards */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          {(['A', 'B', 'C'] as OrderOptionId[]).map((optKey) => {
            const opt = ORDER_OPTIONS[optKey];
            const isSelected = selectedOrder === optKey && !isSpinning;
            const isHighlightedSpin = isSpinning && livePreviewOption === optKey;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (!isSpinning) onSelectOrder(opt.id);
                }}
                className={`rounded-xl p-5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#6D28D9] ring-2 ring-[#6D28D9]/40 shadow-md'
                    : isHighlightedSpin
                    ? 'bg-violet-50 border-[#6D28D9] shadow-sm'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-10 h-10 rounded-lg font-mono text-base font-extrabold flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold">{opt.label}</h3>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981]">
                            <CheckCircle2 className="w-4 h-4" /> TERPILIH RESMI
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                      isSelected
                        ? 'bg-white/10 text-violet-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    3 Partai / Grup
                  </span>
                </div>

                {/* 3 Matches Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {opt.matches.map(([home, away], idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-center ${
                        isSelected
                          ? 'bg-slate-800/90 border-slate-700'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-semibold uppercase ${
                          isSelected ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Pertandingan {idx + 1}
                      </div>
                      <div
                        className={`text-sm font-mono font-extrabold mt-1 tabular-nums ${
                          isSelected ? 'text-white' : 'text-[#6D28D9]'
                        }`}
                      >
                        {home} vs {away}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 ${
                          isSelected ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Contoh: A.{home} vs A.{away}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive 3D/Visual Spinner Wheel */}
        <div className="lg:col-span-6 bg-[#0F172A] text-white rounded-xl p-6 border border-slate-800 shadow-sm flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Disc className={`w-5 h-5 text-violet-400 ${isSpinning ? 'animate-spin' : ''}`} />
              <span className="text-sm font-bold tracking-tight">
                SPINNER VISUAL PENENTU URUTAN
              </span>
            </div>
            <div className="font-mono text-xs tabular-nums">
              {isSpinning ? (
                <span className="text-amber-400 font-bold">
                  BERPUTAR: {countdown.toFixed(1)}s
                </span>
              ) : selectedOrder ? (
                <span className="text-[#10B981] font-bold">
                  HASIL: OPSI {selectedOrder}
                </span>
              ) : (
                <span className="text-slate-400">DURASI SPIN: 5.0 DETIK</span>
              )}
            </div>
          </div>

          {/* Wheel Visual Container */}
          <div className="my-6 relative flex flex-col items-center justify-center">
            {/* Top Pointer Arrow */}
            <div className="z-20 -mb-3 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#10B981] drop-shadow-md" />
            </div>

            {/* Outer Rim */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full p-3 bg-gradient-to-b from-slate-700 to-slate-900 border-4 border-slate-600 shadow-2xl flex items-center justify-center relative">
              {/* Rotating Wheel SVG */}
              <div
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: isSpinning
                    ? 'transform 5000ms cubic-bezier(0.12, 0.8, 0.18, 1)'
                    : 'none',
                }}
                className="w-full h-full rounded-full overflow-hidden relative"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Sector A: 0 to 120 deg */}
                  <path
                    d="M100,100 L100,0 A100,100 0 0,1 186.6,150 Z"
                    fill="#6D28D9"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                  {/* Sector B: 120 to 240 deg */}
                  <path
                    d="M100,100 L186.6,150 A100,100 0 0,1 13.4,150 Z"
                    fill="#2563EB"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                  {/* Sector C: 240 to 360 deg */}
                  <path
                    d="M100,100 L13.4,150 A100,100 0 0,1 100,0 Z"
                    fill="#059669"
                    stroke="#0F172A"
                    strokeWidth="2"
                  />

                  {/* Labels */}
                  <g transform="translate(142, 68) rotate(60)">
                    <text
                      x="0"
                      y="0"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      OPSI A
                    </text>
                    <text
                      x="0"
                      y="13"
                      fill="#DDD6FE"
                      fontSize="7"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      1v2 · 1v3 · 2v3
                    </text>
                  </g>

                  <g transform="translate(100, 158) rotate(180)">
                    <text
                      x="0"
                      y="0"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      OPSI B
                    </text>
                    <text
                      x="0"
                      y="13"
                      fill="#BFDBFE"
                      fontSize="7"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      2v3 · 2v1 · 1v3
                    </text>
                  </g>

                  <g transform="translate(58, 68) rotate(300)">
                    <text
                      x="0"
                      y="0"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      OPSI C
                    </text>
                    <text
                      x="0"
                      y="13"
                      fill="#A7F3D0"
                      fontSize="7"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      3v1 · 3v2 · 2v1
                    </text>
                  </g>
                </svg>
              </div>

              {/* Center Hub */}
              <div className="absolute w-20 h-20 rounded-full bg-[#0F172A] border-4 border-white shadow-lg flex flex-col items-center justify-center text-center z-10">
                <span className="text-[10px] font-mono text-slate-400 uppercase">OPSI</span>
                <span className="text-xl font-extrabold font-mono text-white tabular-nums">
                  {isSpinning ? livePreviewOption : selectedOrder || '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="w-full space-y-3">
            <button
              onClick={handleStartSpin}
              disabled={isSpinning}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md ${
                isSpinning
                  ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
                  : 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isSpinning
                ? `MENGACAK URUTAN PERTANDINGAN... (${countdown.toFixed(1)}s)`
                : 'MULAI SPIN (5 DETIK)'}
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Pengacakan probabilitas merata (33.3% per Opsi)</span>
              <span className="font-mono">Durasi Spin: 5.0 Detik</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Result Announcement Modal */}
      {modalResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F172A] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  PENGUMUMAN HASIL DRAWING RESMI
                </span>
              </div>
              <button
                onClick={() => setModalResult(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-[#6D28D9] font-mono text-3xl font-extrabold flex items-center justify-center mx-auto mb-4">
                {modalResult}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900">
                {ORDER_OPTIONS[modalResult].label} TERPILIH!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {ORDER_OPTIONS[modalResult].description}
              </p>

              <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  URUTAN PARTAI PERTANDINGAN TIAP GRUP:
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {ORDER_OPTIONS[modalResult].matches.map(([h, a], idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-lg py-2 px-2"
                    >
                      <div className="text-[10px] text-slate-500">Partai {idx + 1}</div>
                      <div className="text-sm font-mono font-extrabold text-[#6D28D9]">
                        {h} vs {a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setModalResult(null)}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Tutup Modal
                </button>
                <button
                  onClick={() => {
                    setModalResult(null);
                    onNavigate('drawing-groups');
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] rounded-lg transition-colors cursor-pointer"
                >
                  Lanjut Drawing Grup →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
