import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { PlanPage } from "../src/pages/PlanPage";
import {
  getDefaultPeriod,
  getNextPeriod,
  getPrevPeriod,
  formatPeriodDisplay,
} from "../src/hooks/usePlan";

describe("Phase 6 — PLAN Module Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Planning Horizon Calculation & Stepper Navigation
  // =============================================================
  describe("Period Calculations & Stepping", () => {
    it("computes default period identifiers for weekly, monthly, and yearly horizons", () => {
      expect(getDefaultPeriod("weekly")).toBe("2026-W47");
      expect(getDefaultPeriod("monthly")).toBe("2026-11");
      expect(getDefaultPeriod("yearly")).toBe("2026");
    });

    it("steps forward and backward through weekly cycles correctly", () => {
      expect(getNextPeriod("weekly", "2026-W47")).toBe("2026-W48");
      expect(getPrevPeriod("weekly", "2026-W47")).toBe("2026-W46");
      expect(getNextPeriod("weekly", "2026-W52")).toBe("2027-W01");
      expect(getPrevPeriod("weekly", "2027-W01")).toBe("2026-W52");
    });

    it("steps forward and backward through monthly horizons correctly", () => {
      expect(getNextPeriod("monthly", "2026-11")).toBe("2026-12");
      expect(getPrevPeriod("monthly", "2026-11")).toBe("2026-10");
      expect(getNextPeriod("monthly", "2026-12")).toBe("2027-01");
      expect(getPrevPeriod("monthly", "2027-01")).toBe("2026-12");
    });

    it("steps forward and backward through yearly macro horizons", () => {
      expect(getNextPeriod("yearly", "2026")).toBe("2027");
      expect(getPrevPeriod("yearly", "2026")).toBe("2025");
    });

    it("formats human-readable horizon display strings", () => {
      expect(formatPeriodDisplay("weekly", "2026-W47")).toBe("Week 47, 2026");
      expect(formatPeriodDisplay("monthly", "2026-11")).toBe("November 2026");
      expect(formatPeriodDisplay("yearly", "2026")).toBe("Full Year 2026");
    });
  });

  // =============================================================
  // 2. Plan Items CRUD & Category Organization
  // =============================================================
  describe("Plan Items CRUD Operations", () => {
    it("retrieves plan items for the active horizon ordered by priority", async () => {
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      // Verify sorted priority order
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].priorityOrder).toBeLessThanOrEqual(items[i + 1].priorityOrder);
      }
    });

    it("creates a new plan item in Projects category with priority number", async () => {
      const created = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "projects",
        title: "Build Tauri SQLite WAL storage engine",
        description: "Zero external server dependencies, embedded database engine.",
        priorityOrder: 1,
      });

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.title).toBe("Build Tauri SQLite WAL storage engine");
      expect(created.category).toBe("projects");
      expect(created.priorityOrder).toBe(1);
      expect(created.isCompleted).toBe(false);
    });

    it("creates a custom category plan item with user-defined label", async () => {
      const customItem = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "custom",
        customCategoryName: "Financial Growth",
        title: "Review annual portfolio rebalancing",
        priorityOrder: 2,
      });

      expect(customItem.category).toBe("custom");
      expect(customItem.customCategoryName).toBe("Financial Growth");
      expect(customItem.title).toBe("Review annual portfolio rebalancing");
    });

    it("updates an existing plan item's title, description, and priority", async () => {
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const target = items[0];

      const ok = await DatabaseClient.updatePlanItem({
        id: target.id,
        category: target.category,
        title: `${target.title} (Updated)`,
        description: "Updated plan specifications",
        priorityOrder: 5,
      });

      expect(ok).toBe(true);

      const refreshed = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const updated = refreshed.find((p) => p.id === target.id);
      expect(updated?.title).toContain("(Updated)");
      expect(updated?.description).toBe("Updated plan specifications");
    });

    it("toggles plan item completion and sets completion timestamp", async () => {
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const target = items[0];

      await DatabaseClient.togglePlanItemCompletion(target.id, true);
      let refreshed = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      let item = refreshed.find((p) => p.id === target.id);
      expect(item?.isCompleted).toBe(true);
      expect(item?.completedAt).toBeDefined();

      await DatabaseClient.togglePlanItemCompletion(target.id, false);
      refreshed = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      item = refreshed.find((p) => p.id === target.id);
      expect(item?.isCompleted).toBe(false);
    });

    it("deletes a plan item permanently", async () => {
      const created = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "learning",
        title: "Temporary Plan Objective",
        priorityOrder: 99,
      });

      const deleted = await DatabaseClient.deletePlanItem(created.id);
      expect(deleted).toBe(true);

      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      expect(items.some((i) => i.id === created.id)).toBe(false);
    });
  });

  // =============================================================
  // 3. Priority Reordering
  // =============================================================
  describe("Priority Reordering", () => {
    it("reorders plan items and updates their priorityOrder accordingly", async () => {
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      expect(items.length).toBeGreaterThanOrEqual(2);

      const reversedIds = [items[1].id, items[0].id];
      const reordered = await DatabaseClient.reorderPlanItems(reversedIds);
      expect(reordered).toBe(true);

      const refreshed = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const item1 = refreshed.find((p) => p.id === reversedIds[0]);
      const item2 = refreshed.find((p) => p.id === reversedIds[1]);

      expect(item1?.priorityOrder).toBe(1);
      expect(item2?.priorityOrder).toBe(2);
    });
  });

  // =============================================================
  // 4. Automatic Completion Synchronization
  // =============================================================
  describe("Automatic Completion Synchronization (Tasks & Media -> Plan)", () => {
    it("links a plan item to a daily task and auto-completes when the task is checked", async () => {
      // 1. Create a task
      const task = await DatabaseClient.createTask({
        title: "Daily Task for Plan Sync Test",
        priority: "high",
      });
      expect(task.isCompleted).toBe(false);

      // 2. Create a plan item linked to this task
      const planItem = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "projects",
        title: "Deliver synced milestone",
        linkedTaskId: task.id,
      });
      expect(planItem.isCompleted).toBe(false);

      // 3. Complete the daily task
      await DatabaseClient.toggleTaskCompletion(task.id, true);

      // 4. Verify the plan item was automatically marked complete!
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const syncedPlan = items.find((p) => p.id === planItem.id);
      expect(syncedPlan?.isCompleted).toBe(true);
      expect(syncedPlan?.completedAt).toBeDefined();
    });

    it("links a plan item to a movie and auto-completes when the movie is marked completed", async () => {
      // 1. Create a planned movie
      const movie = await DatabaseClient.createMovie({
        title: "Dune: Part Two",
        status: "planned",
      });

      // 2. Create a plan item linked to this movie
      const planItem = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "entertainment",
        title: "Watch Dune: Part Two in IMAX",
        linkedMovieId: movie.id,
      });
      expect(planItem.isCompleted).toBe(false);

      // 3. Update movie to completed
      await DatabaseClient.updateMovie({
        id: movie.id,
        title: movie.title,
        status: "completed",
        rating: 9.8,
        dateWatched: "2026-11-16",
      });

      // 4. Verify plan item is synchronized to completed
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const syncedPlan = items.find((p) => p.id === planItem.id);
      expect(syncedPlan?.isCompleted).toBe(true);
    });

    it("links a plan item to a series and auto-completes when the series completes", async () => {
      // 1. Create a series with 1 season, 2 episodes
      const series = await DatabaseClient.createSeries({
        title: "Mini Docuseries",
        status: "watching",
        seasons: [
          {
            seasonNumber: 1,
            episodeCount: 2,
            episodeTitles: ["Part 1", "Part 2"],
          },
        ],
      });

      // 2. Link to a plan item
      const planItem = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "entertainment",
        title: "Finish Mini Docuseries",
        linkedSeriesId: series.id,
      });
      expect(planItem.isCompleted).toBe(false);

      // 3. Mark all episodes complete
      const ep1 = series.seasons[0].episodes[0];
      const ep2 = series.seasons[0].episodes[1];
      await DatabaseClient.toggleEpisodeCompletion(ep1.id, true);
      const res = await DatabaseClient.toggleEpisodeCompletion(ep2.id, true);
      expect(res.seriesCompleted).toBe(true);

      // 4. Verify plan item is synchronized to completed
      const items = await DatabaseClient.getPlanItems("weekly", "2026-W47");
      const syncedPlan = items.find((p) => p.id === planItem.id);
      expect(syncedPlan?.isCompleted).toBe(true);
    });
  });

  // =============================================================
  // 5. Carry Forward Unfinished Items (6.20)
  // =============================================================
  describe("Carry Forward Rollover", () => {
    it("rolls unfinished items forward into the next planning period", async () => {
      // Ensure we have an unfinished item in 2026-W47
      const itemToRoll = await DatabaseClient.createPlanItem({
        periodType: "weekly",
        periodIdentifier: "2026-W47",
        category: "learning",
        title: "Master advanced Rust macros",
        priorityOrder: 3,
      });
      expect(itemToRoll.isCompleted).toBe(false);

      // Carry forward from 2026-W47 to 2026-W48
      const carriedCount = await DatabaseClient.carryForwardPlanItems(
        "weekly",
        "2026-W47",
        "2026-W48"
      );

      expect(carriedCount).toBeGreaterThan(0);

      // Verify the item is now present in 2026-W48
      const nextWeekItems = await DatabaseClient.getPlanItems("weekly", "2026-W48");
      const rolled = nextWeekItems.find((p) => p.title === "Master advanced Rust macros");
      expect(rolled).toBeDefined();
      expect(rolled?.periodIdentifier).toBe("2026-W48");
      expect(rolled?.isCompleted).toBe(false);

      // Second carry forward should not duplicate existing items
      const secondCarryCount = await DatabaseClient.carryForwardPlanItems(
        "weekly",
        "2026-W47",
        "2026-W48"
      );
      expect(secondCarryCount).toBe(0);
    });
  });

  // =============================================================
  // 6. UI Component Rendering
  // =============================================================
  describe("PlanPage UI Rendering", () => {
    it("renders the planning page with header, tabs, and action buttons", () => {
      const { container } = render(<PlanPage />);
      expect(container).toBeDefined();

      const html = container.innerHTML;
      expect(html).toContain("Planning Horizon (PLAN)");
      expect(html).toContain("Weekly Tactical");
      expect(html).toContain("Monthly Horizon");
      expect(html).toContain("Yearly Macro");
      expect(html).toContain("New Objective");
      expect(html).toContain("Horizon Completion Progress");
    });
  });
});