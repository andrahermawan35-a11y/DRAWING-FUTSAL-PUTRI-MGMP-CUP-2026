import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { INITIAL_LEAGUES, ORDER_OPTIONS } from '../data/teamsData';
import { LeagueConfig, LeagueDrawState, LeagueId, OrderOptionId, ScheduledMatch } from '../types';

/**
 * Generates full group-stage match schedule based on LeagueDrawState and selected OrderOptionId.
 * Supports groups of any size (3 teams, 4 teams, etc.) and any number of groups.
 */
export function generateSchedules(
  drawStates: Record<LeagueId, LeagueDrawState>,
  selectedOrder: OrderOptionId | null,
  customLeagues?: LeagueConfig[]
): ScheduledMatch[] {
  const activeOrder: OrderOptionId = selectedOrder || 'A';
  const option = ORDER_OPTIONS[activeOrder];
  const leaguesToProcess = customLeagues || INITIAL_LEAGUES;
  const matches: ScheduledMatch[] = [];
  let globalCounter = 1;

  for (const league of leaguesToProcess) {
    const state = drawStates[league.id];
    if (!state) continue;

    // Determine unique group names present in this league's state
    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName))).sort();

    for (const groupName of groupNames) {
      const groupSlots = state.slots
        .filter((s) => s.groupName === groupName)
        .sort((a, b) => a.slotIndex - b.slotIndex);

      const slotIndices = groupSlots.map((s) => s.slotIndex);

      // Determine match pairs for this group
      let matchPairs: Array<[number, number]> = [];

      if (slotIndices.length === 3 && slotIndices[0] === 1 && slotIndices[1] === 2 && slotIndices[2] === 3) {
        // Standard 3-team group obeys the selected Order Option
        matchPairs = option.matches;
      } else if (slotIndices.length >= 2) {
        // Round-robin for N teams (e.g., 4 teams in Liga 4)
        for (let i = 0; i < slotIndices.length; i++) {
          for (let j = i + 1; j < slotIndices.length; j++) {
            matchPairs.push([slotIndices[i], slotIndices[j]]);
          }
        }
      }

      matchPairs.forEach(([homeIdx, awayIdx], idx) => {
        const homeSlot = groupSlots.find((s) => s.slotIndex === homeIdx);
        const awaySlot = groupSlots.find((s) => s.slotIndex === awayIdx);

        const homeCode = homeSlot ? homeSlot.code : `${groupName}.${homeIdx}`;
        const awayCode = awaySlot ? awaySlot.code : `${groupName}.${awayIdx}`;
        const homeTeamName = homeSlot?.team ? homeSlot.team.name : `Menunggu Undian (${homeCode})`;
        const awayTeamName = awaySlot?.team ? awaySlot.team.name : `Menunggu Undian (${awayCode})`;

        matches.push({
          id: `${league.id}-${groupName}-M${idx + 1}-${homeIdx}v${awayIdx}`,
          matchNumber: globalCounter++,
          leagueId: league.id,
          leagueName: league.name,
          groupName,
          matchInGroup: idx + 1,
          homeCode,
          awayCode,
          homeTeamName,
          awayTeamName,
          isReady: Boolean(homeSlot?.team && awaySlot?.team),
        });
      });
    }
  }

  return matches;
}

/**
 * Export Group Drawing Result to PDF
 */
export function exportGroupsToPDF(
  drawStates: Record<LeagueId, LeagueDrawState>,
  targetLeagueId: LeagueId | 'all',
  orderOption: OrderOptionId | null,
  customLeagues?: LeagueConfig[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const baseLeagues = customLeagues || INITIAL_LEAGUES;
  const leaguesToExport =
    targetLeagueId === 'all' ? baseLeagues : baseLeagues.filter((l) => l.id === targetLeagueId);

  let currentY = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('HASIL DRAWING PEMBAGIAN GRUP FUTSAL PUTRI', 105, currentY, { align: 'center' });
  currentY += 6;
  doc.setFontSize(11);
  doc.setTextColor(109, 40, 217);
  doc.text('MGMP CUP TAHUN 2026 · KABUPATEN TEMANGGUNG', 105, currentY, { align: 'center' });
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const orderText = orderOption
    ? `Opsi Urutan Pertandingan: OPSI ${orderOption} (${ORDER_OPTIONS[orderOption].sequenceText})`
    : 'Opsi Urutan Pertandingan: Default OPSI A (1 vs 2, 1 vs 3, 2 vs 3)';
  doc.text(`${orderText}  |  Dicetak: ${new Date().toLocaleString('id-ID')}`, 105, currentY, {
    align: 'center',
  });
  currentY += 8;

  leaguesToExport.forEach((league, index) => {
    if (currentY > 235) {
      doc.addPage();
      currentY = 16;
    }

    const state = drawStates[league.id];
    if (!state) return;

    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName))).sort();
    const totalFilled = state.slots.filter((s) => s.team !== null).length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${league.name} (${state.slots.length} Posisi / ${totalFilled} Tim Terisi)`, 14, currentY);
    currentY += 3;

    const tableRows: string[][] = [];
    for (const groupName of groupNames) {
      const groupSlots = state.slots
        .filter((s) => s.groupName === groupName)
        .sort((a, b) => a.slotIndex - b.slotIndex);

      groupSlots.forEach((slot) => {
        tableRows.push([
          `GRUP ${slot.groupName}`,
          slot.code,
          slot.team ? slot.team.name : 'Belum Diundi',
          slot.team?.pot ? `POT ${slot.team.pot}` : 'Random All',
          slot.team ? `${slot.code} ${slot.team.name}` : '-',
        ]);
      });
    }

    autoTable(doc, {
      startY: currentY,
      head: [['Grup', 'Kode Posisi', 'Nama Tim Sekolah', 'Kategori POT', 'Format Kode Resmi']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [109, 40, 217],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + (index < leaguesToExport.length - 1 ? 10 : 6);
  });

  const fileSuffix = targetLeagueId === 'all' ? 'SEMUA_LIGA' : targetLeagueId.toUpperCase();
  doc.save(`HASIL_DRAWING_GRUP_${fileSuffix}_MGMP_CUP_2026.pdf`);
}

/**
 * Export Group Drawing Result to Excel (.xlsx)
 */
export function exportGroupsToExcel(
  drawStates: Record<LeagueId, LeagueDrawState>,
  targetLeagueId: LeagueId | 'all',
  customLeagues?: LeagueConfig[]
) {
  const wb = XLSX.utils.book_new();
  const baseLeagues = customLeagues || INITIAL_LEAGUES;
  const leaguesToExport =
    targetLeagueId === 'all' ? baseLeagues : baseLeagues.filter((l) => l.id === targetLeagueId);

  leaguesToExport.forEach((league) => {
    const state = drawStates[league.id];
    if (!state) return;

    const rows: Array<Record<string, string | number>> = [];
    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName))).sort();

    for (const groupName of groupNames) {
      const groupSlots = state.slots
        .filter((s) => s.groupName === groupName)
        .sort((a, b) => a.slotIndex - b.slotIndex);

      groupSlots.forEach((slot) => {
        rows.push({
          Liga: league.name,
          Grup: `GRUP ${slot.groupName}`,
          'Kode Posisi': slot.code,
          'No. Urut Tim': slot.team ? slot.team.number : '-',
          'Nama Tim Peserta': slot.team ? slot.team.name : 'Belum Diundi',
          'Asal POT': slot.team?.pot ? `POT ${slot.team.pot}` : 'Tanpa POT (Random)',
          'Kode Resmi Pertandingan': slot.team ? `${slot.code} ${slot.team.name}` : '-',
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 36 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, league.name);
  });

  const fileSuffix = targetLeagueId === 'all' ? 'SEMUA_LIGA' : targetLeagueId.toUpperCase();
  XLSX.writeFile(wb, `HASIL_DRAWING_GRUP_${fileSuffix}_MGMP_CUP_2026.xlsx`);
}

/**
 * Export Group Drawing Result to Word (.doc)
 */
export function exportGroupsToWord(
  drawStates: Record<LeagueId, LeagueDrawState>,
  targetLeagueId: LeagueId | 'all',
  orderOption: OrderOptionId | null,
  customLeagues?: LeagueConfig[]
) {
  const baseLeagues = customLeagues || INITIAL_LEAGUES;
  const leaguesToExport =
    targetLeagueId === 'all' ? baseLeagues : baseLeagues.filter((l) => l.id === targetLeagueId);

  let tablesHtml = '';
  leaguesToExport.forEach((league) => {
    const state = drawStates[league.id];
    if (!state) return;

    let rowsHtml = '';
    const groupNames = Array.from(new Set(state.slots.map((s) => s.groupName))).sort();

    for (const groupName of groupNames) {
      const groupSlots = state.slots
        .filter((s) => s.groupName === groupName)
        .sort((a, b) => a.slotIndex - b.slotIndex);

      groupSlots.forEach((slot, idx) => {
        rowsHtml += `
          <tr>
            ${
              idx === 0
                ? `<td rowspan="${groupSlots.length}" style="font-weight:bold; text-align:center; background:#F8FAFC; border:1px solid #CBD5E1; padding:6px;">GRUP ${slot.groupName}</td>`
                : ''
            }
            <td style="text-align:center; font-family:monospace; font-weight:bold; border:1px solid #CBD5E1; padding:6px;">${slot.code}</td>
            <td style="border:1px solid #CBD5E1; padding:6px;">${slot.team ? slot.team.name : '<i>Belum Diundi</i>'}</td>
            <td style="text-align:center; border:1px solid #CBD5E1; padding:6px;">${slot.team?.pot ? `POT ${slot.team.pot}` : 'Random All'}</td>
            <td style="font-weight:bold; color:#4C1D95; border:1px solid #CBD5E1; padding:6px;">${
              slot.team ? `${slot.code} ${slot.team.name}` : '-'
            }</td>
          </tr>
        `;
      });
    }

    tablesHtml += `
      <h3 style="color:#0F172A; font-family:Arial, sans-serif; margin-top:20px; margin-bottom:8px;">
        ${league.name} — ${league.subtitle}
      </h3>
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; font-size:10.5pt; margin-bottom:16px;">
        <thead>
          <tr style="background-color:#6D28D9; color:#FFFFFF;">
            <th style="border:1px solid #4C1D95; padding:8px; width:14%;">Grup</th>
            <th style="border:1px solid #4C1D95; padding:8px; width:12%;">Kode</th>
            <th style="border:1px solid #4C1D95; padding:8px; width:34%;">Nama Tim Peserta</th>
            <th style="border:1px solid #4C1D95; padding:8px; width:14%;">POT</th>
            <th style="border:1px solid #4C1D95; padding:8px; width:26%;">Format Resmi</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  });

  const htmlDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Hasil Drawing Pembagian Grup MGMP Cup 2026</title>
    </head>
    <body style="font-family:Arial, sans-serif; color:#0F172A;">
      <div style="text-align:center; margin-bottom:20px;">
        <h2 style="margin:0; color:#0F172A;">HASIL DRAWING PEMBAGIAN GRUP FUTSAL PUTRI</h2>
        <h3 style="margin:4px 0; color:#6D28D9;">MGMP CUP TAHUN 2026 · KABUPATEN TEMANGGUNG</h3>
        <p style="font-size:9.5pt; color:#64748B; margin:4px 0;">
          Opsi Urutan Pertandingan: <strong>OPSI ${orderOption || 'A'}</strong> (${
            ORDER_OPTIONS[orderOption || 'A'].sequenceText
          }) | Tanggal Unduh: ${new Date().toLocaleString('id-ID')}
        </p>
      </div>
      ${tablesHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileSuffix = targetLeagueId === 'all' ? 'SEMUA_LIGA' : targetLeagueId.toUpperCase();
  link.href = url;
  link.download = `HASIL_DRAWING_GRUP_${fileSuffix}_MGMP_CUP_2026.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Match Schedules to PDF in a neat structured table
 */
export function exportScheduleToPDF(
  matches: ScheduledMatch[],
  filterLeague: LeagueId | 'all',
  orderOption: OrderOptionId | null
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const activeOrder = orderOption || 'A';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('JADWAL PERTANDINGAN FASE GRUP FUTSAL PUTRI', 105, 15, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(109, 40, 217);
  doc.text('MGMP CUP TAHUN 2026 · KABUPATEN TEMANGGUNG', 105, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Skema Urutan: OPSI ${activeOrder} (${ORDER_OPTIONS[activeOrder].sequenceText})  |  Filter: ${
      filterLeague === 'all' ? 'Semua Liga' : filterLeague.toUpperCase()
    }  |  Total: ${matches.length} Pertandingan`,
    105,
    27,
    { align: 'center' }
  );

  const body = matches.map((m, i) => [
    `#${i + 1}`,
    m.leagueName,
    `Grup ${m.groupName}`,
    `M${m.matchInGroup}`,
    `${m.homeCode} · ${m.homeTeamName}`,
    'VS',
    `${m.awayCode} · ${m.awayTeamName}`,
    m.isReady ? 'Siap' : 'Menunggu',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['No', 'Liga', 'Grup', 'Partai', 'Tim Kandang (Home)', '', 'Tim Tandang (Away)', 'Status']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 16 },
      2: { cellWidth: 16 },
      3: { halign: 'center', cellWidth: 14 },
      4: { cellWidth: 52 },
      5: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
      6: { cellWidth: 52 },
      7: { halign: 'center', cellWidth: 16 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 12, right: 12 },
  });

  doc.save(`JADWAL_PERTANDINGAN_${filterLeague.toUpperCase()}_MGMP_CUP_2026.pdf`);
}

/**
 * Export Match Schedules to Excel (.xlsx) in a neat structured table
 */
export function exportScheduleToExcel(
  matches: ScheduledMatch[],
  filterLeague: LeagueId | 'all',
  orderOption: OrderOptionId | null
) {
  const wb = XLSX.utils.book_new();
  const activeOrder = orderOption || 'A';

  const rows = matches.map((m, idx) => ({
    'No. Partai': idx + 1,
    'Divisi Liga': m.leagueName,
    'Grup': `Grup ${m.groupName}`,
    'Partai Grup': `Pertandingan Ke-${m.matchInGroup}`,
    'Urutan Skema': `OPSI ${activeOrder}`,
    'Kode Home': m.homeCode,
    'Tim Kandang (Home)': m.homeTeamName,
    'Versus': 'VS',
    'Kode Away': m.awayCode,
    'Tim Tandang (Away)': m.awayTeamName,
    'Status Pertandingan': m.isReady ? 'Siap Bertanding' : 'Menunggu Drawing',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 8 },
    { wch: 12 },
    { wch: 30 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Pertandingan');
  XLSX.writeFile(wb, `JADWAL_PERTANDINGAN_${filterLeague.toUpperCase()}_MGMP_CUP_2026.xlsx`);
}

/**
 * Export Match Schedules to Word (.doc) in a neat structured table
 */
export function exportScheduleToWord(
  matches: ScheduledMatch[],
  filterLeague: LeagueId | 'all',
  orderOption: OrderOptionId | null
) {
  const activeOrder = orderOption || 'A';
  const rowsHtml = matches
    .map(
      (m, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="text-align:center; border:1px solid #CBD5E1; padding:6px; font-weight:bold;">${idx + 1}</td>
        <td style="text-align:center; font-weight:bold; border:1px solid #CBD5E1; padding:6px;">${m.leagueName}</td>
        <td style="text-align:center; font-weight:bold; color:#6D28D9; border:1px solid #CBD5E1; padding:6px;">Grup ${m.groupName} (Partai ${m.matchInGroup})</td>
        <td style="border:1px solid #CBD5E1; padding:6px;">
          <span style="font-family:monospace; font-weight:bold; color:#6D28D9;">[${m.homeCode}]</span> ${m.homeTeamName}
        </td>
        <td style="text-align:center; font-weight:bold; color:#DC2626; border:1px solid #CBD5E1; padding:6px; background:#F1F5F9;">VS</td>
        <td style="border:1px solid #CBD5E1; padding:6px;">
          <span style="font-family:monospace; font-weight:bold; color:#059669;">[${m.awayCode}]</span> ${m.awayTeamName}
        </td>
        <td style="text-align:center; font-size:9pt; font-weight:bold; color:${m.isReady ? '#059669' : '#DC2626'}; border:1px solid #CBD5E1; padding:6px;">
          ${m.isReady ? 'Siap Main' : 'Menunggu'}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Jadwal Pertandingan Futsal Putri MGMP Cup 2026</title>
    </head>
    <body style="font-family:Arial, sans-serif; color:#0F172A; padding:20px;">
      <div style="text-align:center; margin-bottom:20px;">
        <h2 style="margin:0; color:#0F172A; font-size:16pt;">JADWAL PERTANDINGAN FASE GRUP FUTSAL PUTRI</h2>
        <h3 style="margin:4px 0; color:#6D28D9; font-size:13pt;">MGMP CUP TAHUN 2026 · KABUPATEN TEMANGGUNG</h3>
        <p style="font-size:9.5pt; color:#64748B; margin:4px 0;">
          Sistem Setengah Kompetisi · Skema Urutan: <strong>OPSI ${activeOrder} (${ORDER_OPTIONS[activeOrder].sequenceText})</strong>
          | Filter: <strong>${filterLeague === 'all' ? 'Semua Liga' : filterLeague.toUpperCase()}</strong>
          | Total: <strong>${matches.length} Pertandingan</strong>
        </p>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:9.5pt; border:1px solid #0F172A;">
        <thead>
          <tr style="background-color:#0F172A; color:#FFFFFF;">
            <th style="border:1px solid #0F172A; padding:8px; width:6%;">No</th>
            <th style="border:1px solid #0F172A; padding:8px; width:10%;">Liga</th>
            <th style="border:1px solid #0F172A; padding:8px; width:13%;">Grup & Partai</th>
            <th style="border:1px solid #0F172A; padding:8px; width:29%;">Tim Kandang (Home)</th>
            <th style="border:1px solid #0F172A; padding:8px; width:6%;">VS</th>
            <th style="border:1px solid #0F172A; padding:8px; width:29%;">Tim Tandang (Away)</th>
            <th style="border:1px solid #0F172A; padding:8px; width:7%;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `JADWAL_PERTANDINGAN_${filterLeague.toUpperCase()}_MGMP_CUP_2026.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
