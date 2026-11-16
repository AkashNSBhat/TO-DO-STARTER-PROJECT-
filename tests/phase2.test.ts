import React from "react";
import { describe, it, expect, vi, render, fireEvent } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { TaskCard } from "../src/components/tasks/TaskCard";
import { TaskFilterTabs } from "../src/components/tasks/TaskFilterTabs";
import { TaskQuickAdd } from "../src/components/tasks/TaskQuickAdd";
import { DailyGoalCard } from "../src/components/tasks/DailyGoalCard";
import type { TaskDetail, Priority } from "../src/lib/db/types";

describe("Phase 2 — Daily Tasks & Goals Test Suite", () => {
  // Reset database before test execution
  resetMockDb();

  // =============================================================
  // 1. Task Creation & CRUD Lifecycle
  // =============================================================
  describe("Task Creation, Update, and Deletion Lifecycle", () => {
    it("creates a new task with priority, category, and subtasks", async () => {
      const created = await DatabaseClient.createTask({
        title: "Build SQLite WAL mode integration tests",
        description: "Ensure multi-thread reading is non-blocking",
        categoryId: "cat-1",
        priority: "urgent",
        dueDate: "2026-11-16",
        subtasks: ["Write WAL pragma check", "Verify connection pool"],
      });

      expect(created).toBeDefined();
      expect(created.title).toBe("Build SQLite WAL mode integration tests");
      expect(created.priority).toBe("urgent");
      expect(created.subtasksCount).toBe(2);
      expect(created.isCompleted).toBe(false);
    });

    it("retrieves task list and verifies task presence", async () => {
      const allTasks = await DatabaseClient.getTasks("all");
      expect(allTasks.length).toBeGreaterThan(0);

      const found = allTasks.find(
        (t) => t.title === "Build SQLite WAL mode integration tests"
      );
      expect(found).toBeDefined();
      expect(found?.priority).toBe("urgent");
    });

    it("updates task title, priority, and due date", async () => {
      const allTasks = await DatabaseClient.getTasks("all");
      const target = allTasks[0];

      const success = await DatabaseClient.updateTask({
        id: target.id,
        title: "Updated Task Title",
        description: "Updated description text",
        priority: "high",
        dueDate: "2026-11-20",
      });

      expect(success).toBe(true);

      const refreshed = await DatabaseClient.getTasks("all");
      const updated = refreshed.find((t) => t.id === target.id);
      expect(updated?.title).toBe("Updated Task Title");
      expect(updated?.priority).toBe("high");
      expect(updated?.dueDate).toBe("2026-11-20");
    });

    it("toggles task completion and verifies status change", async () => {
      const allTasks = await DatabaseClient.getTasks("all");
      const target = allTasks[0];

      const res = await DatabaseClient.toggleTaskCompletion(target.id, true);
      expect(res).toBe(true);

      const refreshed = await DatabaseClient.getTasks("all");
      const toggled = refreshed.find((t) => t.id === target.id);
      expect(toggled?.isCompleted).toBe(true);
      expect(toggled?.status).toBe("completed");
    });

    it("deletes a task permanently", async () => {
      const allTasksBefore = await DatabaseClient.getTasks("all");
      const target = allTasksBefore[0];

      const deleted = await DatabaseClient.deleteTask(target.id);
      expect(deleted).toBe(true);

      const allTasksAfter = await DatabaseClient.getTasks("all");
      const found = allTasksAfter.find((t) => t.id === target.id);
      expect(found).toBeUndefined();
    });
  });

  // =============================================================
  // 2. Subtasks & Checklist Progress
  // =============================================================
  describe("Subtasks Management & Checklist Calculations", () => {
    it("fetches subtasks for a task", async () => {
      const subtasks = await DatabaseClient.getSubtasks("task-1");
      expect(subtasks).toBeDefined();
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks.length).toBeGreaterThan(0);
    });

    it("toggles subtask completion state", async () => {
      const subtasks = await DatabaseClient.getSubtasks("task-1");
      const firstSub = subtasks[0];

      const toggled = await DatabaseClient.toggleSubtaskCompletion(firstSub.id, false);
      expect(toggled).toBe(true);
    });

    it("adds a new subtask to a task", async () => {
      const newSub = await DatabaseClient.addSubtask("task-1", "Added Checklist Item");
      expect(newSub).toBeDefined();
      expect(newSub.title).toBe("Added Checklist Item");
      expect(newSub.isCompleted).toBe(false);
    });
  });

  // =============================================================
  // 3. Daily Goals & Categories
  // =============================================================
  describe("Daily Goal Tracking & Category Metadata", () => {
    it("fetches categories and verifies color tokens", async () => {
      const categories = await DatabaseClient.getTaskCategories();
      expect(categories.length).toBeGreaterThanOrEqual(4);
      expect(categories[0].name).toBeDefined();
      expect(categories[0].color).toMatch(/^#/);
    });

    it("retrieves daily goal target count", async () => {
      const goal = await DatabaseClient.getDailyGoal("2026-11-16");
      expect(goal).toBeDefined();
      expect(goal.targetTasksCount).toBeGreaterThanOrEqual(1);
    });

    it("updates daily goal target count", async () => {
      const res = await DatabaseClient.updateDailyGoal("2026-11-16", 8, "Updated target note");
      expect(res).toBe(true);
    });
  });

  // =============================================================
  // 4. UI Component Interactions
  // =============================================================
  describe("Task Component Rendering & User Interactions", () => {
    const sampleTask: TaskDetail = {
      id: "test-task-1",
      title: "UI Rendering Test Task",
      description: "Sample test description",
      categoryId: "cat-1",
      categoryName: "Deep Work",
      categoryColor: "#14b8a6",
      priority: "high",
      status: "todo",
      dueDate: "2026-11-16",
      isCompleted: false,
      subtasksCount: 3,
      completedSubtasksCount: 1,
    };

    it("renders TaskCard with priority, category, and due date", () => {
      const handleToggle = vi.fn();
      const { getByText, container } = render(
        <TaskCard task={sampleTask} onToggle={handleToggle} />
      );

      expect(container).toHaveTextContent("UI Rendering Test Task");
      expect(container).toHaveTextContent("Deep Work");
      expect(container).toHaveTextContent("High");
      expect(container).toHaveTextContent("Today");
    });

    it("renders DailyGoalCard and computes completion percentage", () => {
      const handleUpdate = vi.fn(async () => true);
      const { getByText, container } = render(
        <DailyGoalCard
          completedCount={3}
          targetCount={5}
          onUpdateGoal={handleUpdate}
        />
      );

      expect(container).toHaveTextContent("3 of 5 tasks finished today");
      expect(container).toHaveTextContent("60%");
    });

    it("renders TaskFilterTabs with count badges", () => {
      const handleChange = vi.fn();
      const counts = {
        all: 10,
        today: 4,
        upcoming: 3,
        overdue: 1,
        completed: 2,
      };

      const { container } = render(
        <TaskFilterTabs
          activeFilter="today"
          onFilterChange={handleChange}
          counts={counts}
        />
      );

      expect(container).toHaveTextContent("Today");
      expect(container).toHaveTextContent("Upcoming");
      expect(container).toHaveTextContent("Overdue");
      expect(container).toHaveTextContent("Completed");
    });
  });
});
