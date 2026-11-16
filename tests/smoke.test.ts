import React from "react";
import { describe, it, expect, vi, render, fireEvent } from "./test-utils";
import { Button } from "../src/components/common/Button";
import { DatabaseClient } from "../src/lib/db/client";
import { invoke } from "@tauri-apps/api/core";
import { resetMockDb } from "./mocks/tauriMock";
import type { AppInfoResponse, TaskDetail } from "../src/lib/db/types";

describe("Milestone T0 — Offline Test Infrastructure Smoke Test", () => {
  // =============================================================
  // Subsystem 1: Basic Assertions & Jest-Compatible Matchers
  // =============================================================
  describe("Subsystem 1: Jest Matchers & Inverted .not Checks", () => {
    it("evaluates primitive equality and types", () => {
      expect(1 + 1).toBe(2);
      expect("DAYMARK").toBe("DAYMARK");
      expect(true).toBeTruthy();
      expect(false).toBeFalsy();
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
      expect(42).toBeDefined();
    });

    it("evaluates deep equality on complex structures", () => {
      const objA = { app: "DAYMARK", version: 1, tags: ["offline", "tauri"] };
      const objB = { app: "DAYMARK", version: 1, tags: ["offline", "tauri"] };
      expect(objA).toEqual(objB);
    });

    it("evaluates relational and containment matchers", () => {
      expect(10).toBeGreaterThan(5);
      expect(10).toBeGreaterThanOrEqual(10);
      expect(5).toBeLessThan(10);
      expect(5).toBeLessThanOrEqual(5);

      expect([1, 2, 3]).toContain(2);
      expect("DAYMARK Phase 1").toContain("Phase 1");
      expect("Deep obsidian theme").toMatch(/obsidian/);
      expect([1, 2, 3, 4]).toHaveLength(4);
    });

    it("evaluates inverted .not matchers", () => {
      expect(1).not.toBe(2);
      expect(undefined).not.toBeDefined();
      expect(false).not.toBeTruthy();
      expect("light").not.toEqual("dark");
      expect([1, 2]).not.toContain(3);
    });

    it("evaluates error throwing with toThrow", () => {
      const thrower = () => {
        throw new Error("Invalid operation");
      };
      expect(thrower).toThrow();
      expect(thrower).toThrow("Invalid operation");
      expect(thrower).toThrow(/operation/);
    });
  });

  // =============================================================
  // Subsystem 2: Mock Spies (vi.fn, vi.spyOn)
  // =============================================================
  describe("Subsystem 2: Mock Spies & Call Tracking", () => {
    it("tracks function invocations, call counts, and arguments", () => {
      const spy = vi.fn((a: number, b: number) => a + b);

      expect(spy).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(0);

      const res = spy(20, 22);
      expect(res).toBe(42);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(20, 22);

      spy(1, 2);
      expect(spy).toHaveBeenCalledTimes(2);

      spy.mockClear();
      expect(spy).toHaveBeenCalledTimes(0);
    });

    it("supports spyOn and method interception", () => {
      const calculator = {
        multiply: (a: number, b: number) => a * b,
      };

      const spy = vi.spyOn(calculator, "multiply");
      const result = calculator.multiply(6, 7);

      expect(result).toBe(42);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(6, 7);

      spy.mockRestore();
      expect(calculator.multiply(3, 3)).toBe(9);
    });
  });

  // =============================================================
  // Subsystem 3: React Component SSR & Micro-DOM Parser
  // =============================================================
  describe("Subsystem 3: React Component Rendering & DOM Matchers", () => {
    it("renders Button component and verifies design tokens and attributes", () => {
      const { getByRole, getByText } = render(
        React.createElement(
          Button,
          { variant: "primary", size: "lg", "aria-label": "Action Submit" },
          "Smoke Test Button"
        )
      );

      const button = getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
      expect(button).toBeEnabled();

      // Check design tokens matching PROJECT.md § 1 Design Tokens Contract
      expect(button).toHaveClass("bg-teal-500");
      expect(button).toHaveClass("text-charcoal-950");
      expect(button).toHaveClass("font-semibold");
      expect(button).toHaveClass("px-4.5"); // size="lg"

      // Check attributes
      expect(button).toHaveAttribute("aria-busy", "false");
      expect(button).toHaveAttribute("aria-label", "Action Submit");

      // Check text content
      expect(button).toHaveTextContent("Smoke Test Button");
      expect(getByText("Smoke Test Button")).toBeInTheDocument();
    });

    it("handles click events through fireEvent", () => {
      const handleClick = vi.fn();
      const buttonElem = React.createElement(
        Button,
        { variant: "secondary", onClick: handleClick },
        "Trigger Event"
      );

      const { getByRole } = render(buttonElem);
      const button = getByRole("button");

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("verifies disabled state attributes on Button", () => {
      const { getByRole } = render(
        React.createElement(
          Button,
          { variant: "danger", disabled: true },
          "Delete All"
        )
      );

      const button = getByRole("button");
      expect(button).toBeDisabled();
      expect(button).not.toBeEnabled();
      expect(button).toHaveClass("disabled:opacity-50");
    });
  });

  // =============================================================
  // Subsystem 4: Tauri IPC Mock Bridge & Seed Data Conformance
  // =============================================================
  describe("Subsystem 4: Tauri IPC Mock Bridge & Interface Contracts", () => {
    it("intercepts get_app_info and returns system telemetry", async () => {
      const appInfo = await invoke<AppInfoResponse>("get_app_info");
      expect(appInfo).toBeDefined();
      expect(appInfo.name).toBe("DAYMARK");
      expect(appInfo.version).toBe("0.1.0");
      expect(appInfo.database_engine).toContain("SQLite");
    });

    it("fetches dashboard data via DatabaseClient with exact seed contracts", async () => {
      const dashboard = await DatabaseClient.getDashboardData();

      expect(dashboard).toBeDefined();
      expect(dashboard.streakCount).toBe(14);
      expect(dashboard.greeting).toContain("2026");
      expect(dashboard.metrics.activeSeriesCount).toBe(3);
      expect(dashboard.dailyChecklist).toHaveLength(5);
      expect(dashboard.scheduleSlots.length).toBeGreaterThan(0);
      expect(dashboard.activitySpline.length).toBe(7);
    });

    it("fetches tasks and covers all 4 priorities and 4 statuses", async () => {
      const allTasks: TaskDetail[] = await DatabaseClient.getTasks("all");

      expect(allTasks.length).toBeGreaterThan(0);

      const priorities = new Set(allTasks.map((t) => t.priority));
      expect(priorities.has("urgent")).toBeTruthy();
      expect(priorities.has("high")).toBeTruthy();
      expect(priorities.has("medium")).toBeTruthy();
      expect(priorities.has("low")).toBeTruthy();

      const statuses = new Set(allTasks.map((t) => t.status));
      expect(statuses.has("todo")).toBeTruthy();
      expect(statuses.has("in_progress")).toBeTruthy();
      expect(statuses.has("completed")).toBeTruthy();
      expect(statuses.has("cancelled")).toBeTruthy();
    });

    it("toggles task completion and verifies state mutation and database reset", async () => {
      // Find a pending urgent task
      const initialTasks = await DatabaseClient.getTasks("all");
      const targetTask = initialTasks.find((t) => t.id === "task-urgent-1");
      expect(targetTask).toBeDefined();
      expect(targetTask!.isCompleted).toBeFalsy();

      // Toggle to completed
      const toggleSuccess = await DatabaseClient.toggleTaskCompletion("task-urgent-1", true);
      expect(toggleSuccess).toBe(true);

      const updatedTasks = await DatabaseClient.getTasks("all");
      const updatedTask = updatedTasks.find((t) => t.id === "task-urgent-1");
      expect(updatedTask!.isCompleted).toBe(true);
      expect(updatedTask!.status).toBe("completed");

      // Verify resetMockDb restores pristine state
      resetMockDb();
      const resetTasks = await DatabaseClient.getTasks("all");
      const restoredTask = resetTasks.find((t) => t.id === "task-urgent-1");
      expect(restoredTask!.isCompleted).toBe(false);
    });
  });
});
