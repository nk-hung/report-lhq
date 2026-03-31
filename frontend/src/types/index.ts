export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  data: {
    access_token: string;
  };
  message: string;
  statusCode: number;
}

export interface TotalReport {
  totalCp: number;
  totalDt: number;
  totalProfit: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface DayRecord {
  day: number;
  cp: number;
  dt: number;
  hq: number;
}

export interface CompareRecord {
  subId: string;
  tcp: number;
  tdt: number;
  tln: number;
  days: DayRecord[];
}

export interface CompareResponse {
  records: CompareRecord[];
  total: number;
  maxDays: number;
  currentSessionId: string | null;
  prevSessionId: string | null;
  nextSessionId: string | null;
  oldestSessionId: string | null;
}

export interface UserPreferences {
  highlightedSubId2s: string[];
}

export interface SavedProduct {
  id?: string;
  subId2: string;
}

export interface SavedProductStats {
  tcp: number;
  tdt: number;
  hq: number;
}
