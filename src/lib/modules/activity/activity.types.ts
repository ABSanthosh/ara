/**
 * Some stats for giggles:
 * - you've moved tabs x number of times/ x km (maybe use the avg tab width to estimate distance)
 * - you've had y number of tabs open simultaneously (peak)
 * - total time spent on each domain
 * - number of discarded/frozen tabs
 * - average session duration per domain
 */

// ============================================
// SITE (Lightweight metadata only)
// ============================================

export type Site = {
  domain: string;
  favicon: string;

  // Incrementally updated (not computed from sessions)
  stats: SiteStats;
};

export type SiteStats = {
  lastVisit: Date;
  firstVisit: Date;
  totalSessions: number;
  statsLastUpdated: Date;
  totalActiveTime: number;
  totalPassiveTime: number;
};

// ============================================
// SESSION (Raw tracking data)
// ============================================
export type SiteSession = {
  id: string;
  title: string;
  domain: string;

  tabId: number;
  windowId: number;

  openedAt: Date;
  closedAt?: Date;

  // Activity tracking
  activities: SiteActivity[];

  // Computed from activities (cached for performance)
  computed: {
    totalActiveTime: number;
    totalPassiveTime: number;
    totalIdleTime: number;
  };

  // Tab state
  hadAudio: boolean;
  hadVideo: boolean;
};

export type SiteActivity = {
  end: Date;
  start: Date;
  type: "active" | "passive" | "idle";
};

// ============================================
// DAILY STATS (Pre-computed for performance)
// ============================================

export type DailyStats = {
  date: string; // "2024-01-31"

  // Per-domain stats
  domains: Record<string, DomainDayStats>;

  // Aggregated totals
  totals: {
    activeTime: number;
    passiveTime: number;
    sessions: number;
    uniqueDomains: number;
  };

  // Hourly breakdown (for daily graph)
  hourlyActivity: number[]; // 24 elements (active time per hour)

  // Top sites
  topByActiveTime: Array<{ domain: string; time: number }>; // Top 5
};

export type DomainDayStats = {
  domain: string;
  activeTime: number;
  passiveTime: number;
  sessions: number;
  firstVisit: Date;
  lastVisit: Date;
};
// ============================================
// WEEKLY STATS (Computed from daily stats)
// ============================================

export type WeeklyStats = {
  week: string; // "2024-W05"
  weekStart: Date;
  weekEnd: Date;

  // Roll up from daily stats
  totals: {
    activeTime: number;
    passiveTime: number;
    sessions: number;
    uniqueDomains: number;
  };

  averages: {
    activeTimePerDay: number;
    sessionsPerDay: number;
    sessionDuration: number;
  };

  // Daily breakdown for week view
  daily: string[]; // ["2024-01-01", "2024-01-02", ...]

  // Top sites for the week
  topByActiveTime: Array<{ domain: string; time: number }>;
  topBySessions: Array<{ domain: string; count: number }>;

  // Week-over-week comparison
  previousWeek?: {
    activeTime: number;
    change: number; // Percentage change
  };
};

// ============================================
// ROOT STORAGE STRUCTURE
// ============================================
export type TActivityStore = {
  // Meta
  version: number; // For schema migrations
  lastSync: Date; // When stats were last computed
  timezone: string; // Important for day boundaries

  // Site metadata (lightweight, all in memory)
  sites: Record<string, Site>;

  // Recent sessions only (last 7 days)
  recentSessions: Record<string, SiteSession[]>;

  // Daily stats (indexed by date)
  daily: Record<string, DailyStats>;

  // Weekly stats (computed on-demand or cached)
  weekly: Record<string, WeeklyStats>;

  // Settings
  settings: {
    idleTimeout: number;
    trackingEnabled: boolean;
    dataRetentionDays: number; // How long to keep raw sessions
  };
};
