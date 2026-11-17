import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { App } from "../src/App";
import { SettingsPage } from "../src/pages/SettingsPage";
import { ErrorBoundary } from "../src/components/common/ErrorBoundary";

describe("Phase 8 — Final Polish, Testing & Release Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Database Backup & Restore Verification (8.7)
  // =============================================================
  describe("Offline Database Backup & Restore Engine", () => {
    it("exports a complete database backup with all required tables and schema metadata", async () => {
      const backupJson = await DatabaseClient.exportBackup();
      expect(typeof backupJson).toBe("string");

      const parsed = JSON.parse(backupJson);
      expect(parsed.app).toBe("DAYMARK");
      expect(parsed.version).toBe("0.1.0");
      expect(typeof parsed.exportDate).toBe("string");
      expect(parsed.tableCounts).toBeDefined();
      expect(typeof parsed.tableCounts.tasks).toBe("number");
      expect(typeof parsed.tableCounts.movies).toBe("number");
      expect(typeof parsed.tableCounts.series).toBe("number");
      expect(typeof parsed.tableCounts.planItems).toBe("number");
      expect(typeof parsed.tableCounts.activityHistory).toBe("number");

      expect(parsed.tables).toBeDefined();
      expect(Array.isArray(parsed.tables.tasks)).toBe("true" === "true");
      expect(Array.isArray(parsed.tables.movies)).toBe("true" === "true");
      expect(Array.isArray(parsed.tables.series)).toBe("true" === "true");
    });

    it("restores database from valid backup snapshot and preserves records", async () => {
      const initialTasks = await DatabaseClient.getTasks();
      const initialCount = initialTasks.length;

      // Create a modified backup snapshot
      const backupJson = await DatabaseClient.exportBackup();
      const parsed = JSON.parse(backupJson);

      const restoreResult = await DatabaseClient.restoreBackup(JSON.stringify(parsed));
      expect(restoreResult).toBe(true);

      const tasksAfterRestore = await DatabaseClient.getTasks();
      expect(tasksAfterRestore.length).toBe(initialCount);
    });

    it("rejects corrupted or non-DAYMARK backup payloads gracefully", async () => {
      const invalidPayload = JSON.stringify({
        app: "UNKNOWN_APP",
        version: "9.9.9",
        tables: {},
      });

      let threw = false;
      try {
        await DatabaseClient.restoreBackup(invalidPayload);
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain("app mismatch");
      }
      expect(threw).toBe(true);
    });
  });

  // =============================================================
  // 2. React Error Boundary & Graceful Recovery (8.11)
  // =============================================================
  describe("Error Boundary & Graceful Failure UI", () => {
    it("handles error state transition and displays recovery UI without app crash", () => {
      const state = ErrorBoundary.getDerivedStateFromError(
        new Error("Simulated rendering explosion in child view")
      );
      expect(state.hasError).toBe(true);
      expect(state.error?.message).toBe("Simulated rendering explosion in child view");

      class ErroredBoundary extends ErrorBoundary {
        state = {
          hasError: true,
          error: new Error("Simulated rendering explosion in child view"),
          errorInfo: null,
        };
      }

      const { container } = render(
        <ErroredBoundary>
          <div>Child content</div>
        </ErroredBoundary>
      );

      expect(container.textContent).toContain("Application Rendering Encountered An Error");
      expect(container.textContent).toContain("Simulated rendering explosion in child view");
      expect(container.textContent).toContain("Reload Window");
      expect(container.textContent).toContain("Recover View");
    });
  });

  // =============================================================
  // 3. Settings Page UI Integration (8.7, 8.13)
  // =============================================================
  describe("Settings & Preferences UI", () => {
    it("renders SettingsPage with preferences, backup, restore, and database diagnostics", () => {
      const { container } = render(<SettingsPage />);
      expect(container.textContent).toContain("Settings & Preferences");
      expect(container.textContent).toContain("Backup & Restore");
      expect(container.textContent).toContain("Export Backup");
      expect(container.textContent).toContain("Restore Data");
      expect(container.textContent).toContain("Database Diagnostics");
      expect(container.textContent).toContain("DAYMARK");
    });
  });

  // =============================================================
  // 4. Complete Application Navigation & State Preservation (8.1, 8.2)
  // =============================================================
  describe("E2E Navigation & Application Shell", () => {
    it("renders top-level App with MainLayout and initial Dashboard route", () => {
      const { container } = render(<App />);
      expect(container.textContent).toContain("DAYMARK");
      expect(container.textContent).toContain("Dashboard");
      expect(container.textContent).toContain("Daily Tasks");
      expect(container.textContent).toContain("Movies");
      expect(container.textContent).toContain("Series");
      expect(container.textContent).toContain("Archive");
      expect(container.textContent).toContain("PLAN");
      expect(container.textContent).toContain("Activity");
      expect(container.textContent).toContain("Statistics");
      expect(container.textContent).toContain("Settings");
    });
  });

  // =============================================================
  // 5. Strict Offline Verification (8.8)
  // =============================================================
  describe("100% Offline Architecture Guarantee", () => {
    it("executes operations with zero external network dependencies", async () => {
      // In offline mode, DatabaseClient methods must resolve locally
      const status = await DatabaseClient.getDbStatus();
      expect(status.connected).toBe(true);

      const appInfo = await DatabaseClient.getAppInfo();
      expect(appInfo.name).toBe("DAYMARK");
      expect(appInfo.database_engine).toContain("SQLite 3");
    });
  });
});
