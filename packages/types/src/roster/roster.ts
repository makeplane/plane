export type TRosterPlayerStatus = "active" | "injured" | "inactive" | "pending";

export interface IRosterPlayer {
  id: string;
  program_id: string;
  player_name: string;
  jersey_number: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  class_year: string | null;
  status: TRosterPlayerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IRosterFilters {
  search?: string;
  position?: string;
  status?: TRosterPlayerStatus | "";
  class_year?: string;
}

export interface IRosterPlayerPayload {
  player_name: string;
  jersey_number?: string | null;
  position?: string | null;
  height?: string | null;
  weight?: string | null;
  class_year?: string | null;
  status?: TRosterPlayerStatus;
  notes?: string | null;
}

export interface IRosterImportPayload {
  players: IRosterPlayerPayload[];
}

export interface IRosterImportResponse {
  success: boolean;
  data: IRosterPlayer[];
  imported_count: number;
  message: string;
}
