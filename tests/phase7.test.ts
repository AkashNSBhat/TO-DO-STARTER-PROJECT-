import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { StatisticsPage } from "../src/pages/StatisticsPage";

describe("Phase 7 — Activity History & Statistics Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Productivity & Media Metric Computations
  // =============================================================
  describe("Database Metric Calculations (Strict Real Records)", () => {
    it("retrieves comprehensive statistics data with all metric fields populated", async () => {
      const stats = await DatabaseClient.getStatistics();
      expect(stats).toBeDefined();

      // Productivity metrics
      expect(typeof stats.totalTasksCompleted).toBe("number");
      expect(typeof stats.tasksCompletionRate).toBe("number");
      expect(typeof stats.currentStreakDays).toBe("number");
      expect(typeof stats.longestStreakDays).toBe("number");
      expect(typeof stats.dailyTaskAverage).toBe("number");

      // Entertainment metrics
      expect(typeof stats.totalMoviesCompleted).toBe("number");
      expect(typeof stats.averageMovieRating).toBe("number");
      expect(typeof stats.totalEpisodesCompleted).toBe("number");
      expect(typeof stats.totalSeasonsCompleted).toBe("number");
      expect(typeof stats.totalSeriesCompleted).toBe("number");
      expect(typeof stats.averageSeriesRating).toBe("number");
      expect(typeof stats.totalWatchTimeHours).toBe("number");

      // Categorical and distribution structures
      expect(Array.isArray(stats.completionsByCategory)).toBe(true);
      expect(Array.isArray(stats.completionsByDayOfWeek)).toBe(true);
      expect(Array.isArray(stats.monthlyTrend)).toBe(true);
      expect(Array.isArray(stats.genreDistribution)).toBe(true);
      expect(Array.isArray(stats.ratingDistribution)).toBe(true);
      expect(Array.isArray(stats.heatmapData)).toBe(true);
      expect(typeof stats.planCompletionRate).toBe("number");
    });

    it("verifies day-of-week completions structure covers Monday through Sunday", async () => {
      const stats = await DatabaseClient.getStatistics();
      const days = stats.completionsByDayOfWeek.map((d) => d.day);
      expect(days).toContain("Mon");
      expect(days).toContain("Tue");
      expect(days).toContain("Wed");
      expect(days).toContain("Thu");
      expect(days).toContain("Fri");
      expect(days).toContain("Sat");
      expect(days).toContain("Sun");
    });

    it("verifies rating distribution covers ratings from 1 to 10", async () => {
      const stats = await DatabaseClient.getStatistics();
      const ratings = stats.ratingDistribution.map((r) => r.rating);
      for (let r = 1; r <= 10; r++) {
        expect(ratings).toContain(r);
      }
    });

    it("verifies genre distribution contains frequency rankings", async () => {
      const stats = await DatabaseClient.getStatistics();
      expect(stats.genreDistribution.length).toBeGreaterThan(0);
      for (const g of stats.genreDistribution) {
        expect(typeof g.genre).toBe("string");
        expect(typeof g.count).toBe("number");
      }
    });
  });

  // =============================================================
  // 2. Activity History Audit Logging & Chronological Timeline
  // =============================================================
  describe("Chronological Activity Audit Trail", () => {
    it("retrieves the chronological activity history timeline", async () => {
      const history = await DatabaseClient.getActivityHistory("all", "all", 50);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      // Verify each item structure
      const first = history[0];
      expect(first.id).toBeDefined();
      expect(first.activityType).toBeDefined();
      expect(first.entityType).toBeDefined();
      expect(first.entityId).toBeDefined();
      expect(first.title).toBeDefined();
      expect(first.timestamp).toBeDefined();
    });

    it("filters activity history by activity type", async () => {
      const taskEvents = await DatabaseClient.getActivityHistory("task", "all", 50);
      expect(taskEvents.length).toBeGreaterThan(0);
      for (const e of taskEvents) {
        expect(e.activityType.startsWith("task")).toBe(true);
      }

      const movieEvents = await DatabaseClient.getActivityHistory("movie", "all", 50);
      for (const e of movieEvents) {
        expect(e.activityType.startsWith("movie")).toBe(true);
      }
    });

    it("filters activity history by date range", async () => {
      const allEvents = await DatabaseClient.getActivityHistory("all", "all", 100);
      const weekEvents = await DatabaseClient.getActivityHistory("all", "week", 100);

      expect(Array.isArray(weekEvents)).toBe(true);
      expect(weekEvents.length).toBeLessThanOrEqual(allEvents.length);
    });

    it("creates an activity audit entry when completing a daily task", async () => {
      const task = await DatabaseClient.createTask({
        title: "Verify Audit Trail Event Creation",
        priority: "medium",
      });

      await DatabaseClient.toggleTaskCompletion(task.id, true);

      // Task is completed, verify history includes task_completed event
      const history = await DatabaseClient.getActivityHistory("task", "all", 10);
      const matched = history.find((h) => h.entityId === task.id || h.title.includes("Verify Audit Trail"));
      expect(matched).toBeDefined();
    });

    it("creates an activity audit entry when completing a plan objective", async () => {
      const planItem = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "projects",
        title: "Achieve Audit Trail Verification",
        priorityOrder: 1,
      });

      await DatabaseClient.togglePlanItemCompletion(planItem.id, true);

      const history = await DatabaseClient.getActivityHistory("plan", "all", 10);
      const matched = history.find((h) => h.entityId === planItem.id || h.title.includes("Achieve Audit Trail"));
      expect(matched).toBeDefined();
    });
  });

  // =============================================================
  // 3. UI Component Rendering
  // =============================================================
  describe("StatisticsPage UI Integration", () => {
    it("renders the Statistics page with headers, navigation tabs, and KPI cards", () => {
      const { container } = render(<StatisticsPage />);
      expect(container).toBeDefined();

      const html = container.innerHTML;
      expect(html).toContain("Activity History &amp; Analytics");
      expect(html).toContain("Productivity Overview");
      expect(html).toContain("Entertainment Analytics");
      expect(html).toContain("Activity Timeline");
      expect(html).toContain("Tasks Finished");
      expect(html).toContain("Consistency Streak");
      expect(html).toContain("Activity Contribution Heatmap");
    });
  });
});
