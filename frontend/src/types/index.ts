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
    username: string;
    role: string;
  };
  message: string;
  statusCode: number;
}

export interface UserInfo {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
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
  recordId?: string;
  importDate?: string;
  importOrder?: number;
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

export interface ProductFolder {
  _id: string;
  name: string;
}

export interface SavedProduct {
  id?: string;
  subId2: string;
  folderId?: string | null;
}

export interface SavedProductStats {
  tcp: number;
  tdt: number;
  hq: number;
}

export interface ImportSession {
  _id: string;
  importDate: string;
  importOrder: number;
  recordCount: number;
}
