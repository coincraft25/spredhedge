export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'investor';
  timezone: string;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  country: string;
  indicative_ticket: string;
  note: string;
  status: 'new' | 'approved' | 'rejected';
  created_at: string;
}

export interface Investor {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  notes: string;
}

export interface Allocation {
  id: string;
  category: string;
  allocation_pct: number;
  description: string;
  thesis: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  category: string;
  asset_label: string;
  weight_pct: number;
  note: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  label: string;
  chain: string;
  address: string;
  explorer_url: string;
  created_at: string;
}

export interface NavHistory {
  id: string;
  date: string;
  nav: number;
  aum_usd: number;
  created_at: string;
}

export interface PerformanceMetric {
  id: string;
  period: string;
  mtd_return: number;
  ytd_return: number;
  sixm_return: number;
  max_drawdown: number;
  updated_at: string;
}

export interface Report {
  id: string;
  month: string;
  title: string;
  summary: string;
  file_url: string;
  created_at: string;
}

export interface Position {
  id: string;
  title: string;
  ticker: string | null;
  sector: string | null;
  status: 'Draft' | 'Live' | 'Closed' | 'Archived';
  visibility: 'admin_only' | 'members_view';
  entry_date: string;
  opened_date: string | null;
  entry_price: number;
  quantity: number;
  cost_basis: number;
  target_price: number | null;
  market_price: number | null;
  price_updated_at: string | null;
  closing_price: number | null;
  closing_date: string | null;
  realized_pnl: number | null;
  notes_admin: string;
  public_note: string;
  tags: string[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: 'create' | 'edit' | 'close' | 'archive' | 'publish' | 'unpublish' | 'restore';
  position_id: string | null;
  user_id: string | null;
  timestamp: string;
  diff_summary: string | null;
  notes: string | null;
}

export interface PositionWithCalculations extends Position {
  unrealized_pnl: number;
  performance_pct: number;
  days_held: number;
}
