export interface SeatingStudent {
  id: string;
  name: string;
}

export interface Seat {
  id: number;
  student: SeatingStudent | null;
  isRevealed: boolean;
  isExcluded: boolean;
  pinnedStudentId: string | null;
}

export interface SeatingConfig {
  rows: number;
  cols: number;
}

export interface RouletteItem {
  id: string;
  text: string;
}
