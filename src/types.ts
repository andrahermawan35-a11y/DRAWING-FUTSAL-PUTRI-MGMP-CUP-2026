export type LeagueId = 'liga1' | 'liga2' | 'liga3' | 'liga4';

export type OrderOptionId = 'A' | 'B' | 'C';

export interface OrderOption {
  id: OrderOptionId;
  label: string;
  description: string;
  matches: Array<[number, number]>; // 1-indexed team slot in group: e.g. [1, 2], [1, 3], [2, 3]
  sequenceText: string;
}

export interface Team {
  id: string;
  number: number;
  name: string;
  leagueId: LeagueId;
  pot: 1 | 2 | 3 | null; // null for Liga 4 (Random All)
}

export interface GroupSlot {
  groupName: string; // 'A', 'B', 'C', 'D', 'E', 'F', ...
  slotIndex: number; // 1, 2, 3, 4, ...
  code: string; // e.g. "A.1", "A.2", "E.3", "F.1"
  team: Team | null;
}

export interface LeagueConfig {
  id: LeagueId;
  name: string;
  shortName: string;
  subtitle: string;
  totalTeams: number;
  hasPots: boolean;
  groups: string[]; // ['A', 'B', 'C', 'D'] or ['A', 'B', 'C', 'D', 'E', 'F', ...]
  groupMatchesCount: number;
  knockoutMatchesCount: number; // 8 Besar (4) + Semifinal (2) + Final/3rd (2) = 7 or 8
}

export interface LeagueDrawState {
  leagueId: LeagueId;
  slots: GroupSlot[];
  isCompleted: boolean;
  lastUpdated: string | null;
}

export interface ScheduledMatch {
  id: string;
  matchNumber: number;
  leagueId: LeagueId;
  leagueName: string;
  groupName: string;
  matchInGroup: number;
  homeCode: string;
  awayCode: string;
  homeTeamName: string;
  awayTeamName: string;
  isReady: boolean;
}

export type ActiveMenu =
  | 'dashboard'
  | 'database'
  | 'drawing-order'
  | 'drawing-bracket'
  | 'drawing-groups'
  | 'schedule';
