export interface TableStat {
  name: string;
  count: number;
}

export interface DbStatusResponse {
  connected: boolean;
  path: string;
  journal_mode: string;
  foreign_keys_enabled: boolean;
  migration_version: number;
  tables_count: number;
  table_stats: TableStat[];
  ping_ms: number;
}

export interface AppInfoResponse {
  name: string;
  version: string;
  description: string;
  os: string;
  database_engine: string;
  sqlite_version: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type MovieStatus = 'planned' | 'watching' | 'completed';
export type SeriesStatus = 'planned' | 'watching' | 'completed';
export type PlanPeriod = 'weekly' | 'monthly' | 'yearly';
export type PlanCategory = 'entertainment' | 'learning' | 'personal_goals' | 'projects' | 'custom';
export type ActivityType = 
  | 'task_completed' 
  | 'movie_completed' 
  | 'episode_completed' 
  | 'series_completed' 
  | 'plan_completed' 
  | 'historical_added';

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  category_id?: string;
  status: TaskStatus;
  is_completed: boolean;
  completed_at?: string;
  reminder_at?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  position: number;
  created_at: string;
}

export interface DailyGoal {
  id: string;
  date: string;
  target_tasks_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  title: string;
  release_year?: number;
  poster_url?: string;
  status: MovieStatus;
  personal_rating?: number;
  date_watched?: string;
  notes?: string;
  is_historical: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  release_year?: number;
  poster_url?: string;
  status: SeriesStatus;
  total_seasons: number;
  personal_rating?: number;
  date_completed?: string;
  notes?: string;
  is_historical: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  total_episodes: number;
  created_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  series_id: string;
  episode_number: number;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  created_at: string;
}

export interface PlanItem {
  id: string;
  period_type: PlanPeriod;
  period_identifier: string;
  category: PlanCategory;
  custom_category_name?: string;
  title: string;
  description?: string;
  priority_order: number;
  is_completed: boolean;
  completed_at?: string;
  linked_task_id?: string;
  linked_movie_id?: string;
  linked_series_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityHistoryItem {
  id: string;
  activity_type: ActivityType;
  entity_type: string;
  entity_id: string;
  title: string;
  metadata_json?: string;
  timestamp: string;
}
