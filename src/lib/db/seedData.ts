import {
  TaskDetail,
  MovieDetail,
  SeriesDetail,
  SeriesFull,
  ArchiveItem,
  PlanItem,
  ActivityHistoryItem,
  StatisticsData,
  AppSettings,
  TodayGoals,
  ScheduleSlot,
  ActivitySplinePoint,
} from "./types";

export interface FallbackSeedDataSet {
  tasks: TaskDetail[];
  movies: MovieDetail[];
  seriesSummary: SeriesDetail[];
  seriesDetailMap: Record<string, SeriesFull>;
  archiveItems: ArchiveItem[];
  planItems: PlanItem[];
  activityHistory: ActivityHistoryItem[];
  statistics: StatisticsData;
  appSettings: AppSettings;
  todayGoals: TodayGoals;
  scheduleSlots: ScheduleSlot[];
  activitySpline: ActivitySplinePoint[];
}

export const fallbackSeedData: FallbackSeedDataSet = {
  appSettings: {
    theme: "dark",
    streak_count: "0",
    streak_last_date: "",
    user_name: "there",
    app_version: "0.1.0",
    sidebar_collapsed: "false",
  },

  todayGoals: {
    targetTasksCount: 5,
    notes: "",
  },

  scheduleSlots: [],

  activitySpline: [],

  tasks: [],

  movies: [],

  seriesSummary: [],

  seriesDetailMap: {},

  archiveItems: [],

  planItems: [],

  activityHistory: [],

  statistics: {
    totalTasksCompleted: 0,
    tasksCompletionRate: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    dailyTaskAverage: 0,
    totalMoviesCompleted: 0,
    averageMovieRating: 0,
    totalEpisodesCompleted: 0,
    totalSeasonsCompleted: 0,
    totalSeriesCompleted: 0,
    averageSeriesRating: 0,
    totalWatchTimeHours: 0,
    completionsByCategory: [],
    completionsByDayOfWeek: [
      { day: "Mon", completions: 0 },
      { day: "Tue", completions: 0 },
      { day: "Wed", completions: 0 },
      { day: "Thu", completions: 0 },
      { day: "Fri", completions: 0 },
      { day: "Sat", completions: 0 },
      { day: "Sun", completions: 0 },
    ],
    monthlyTrend: [],
    genreDistribution: [],
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 },
      { rating: 6, count: 0 },
      { rating: 7, count: 0 },
      { rating: 8, count: 0 },
      { rating: 9, count: 0 },
      { rating: 10, count: 0 },
    ],
    heatmapData: [],
    planCompletionRate: 0,
  },
};
