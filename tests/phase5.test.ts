import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { ArchivePage } from "../src/pages/ArchivePage";

describe("Phase 5 — Entertainment Archive Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Unified Archive Retrieval & Categorization
  // =============================================================
  describe("Combined Entertainment Library & Section Filters", () => {
    it("retrieves a combined list of completed movies and series", async () => {
      const allArchive = await DatabaseClient.getArchiveData("all");
      expect(Array.isArray(allArchive)).toBe(true);
      expect(allArchive.length).toBeGreaterThan(0);

      const hasMovie = allArchive.some((item) => item.type === "movie");
      const hasSeries = allArchive.some((item) => item.type === "series");
      expect(hasMovie).toBe(true);
      expect(hasSeries).toBe(true);
    });

    it("filters archive collection by movies only", async () => {
      const moviesOnly = await DatabaseClient.getArchiveData("movies");
      expect(moviesOnly.length).toBeGreaterThan(0);
      for (const m of moviesOnly) {
        expect(m.type).toBe("movie");
      }
    });

    it("filters archive collection by series only", async () => {
      const seriesOnly = await DatabaseClient.getArchiveData("series");
      expect(seriesOnly.length).toBeGreaterThan(0);
      for (const s of seriesOnly) {
        expect(s.type).toBe("series");
      }
    });
  });

  // =============================================================
  // 2. Direct Historical Entries (Movies & Series)
  // =============================================================
  describe("Historical Media Addition (Direct-to-Archive)", () => {
    it("adds a historical movie with approximate completion year, rating, and notes", async () => {
      const historicalMovie = await DatabaseClient.addHistoricalEntry({
        itemType: "movie",
        title: "The Prestige",
        releaseYear: 2006,
        rating: 9.6,
        genres: ["Mystery", "Sci-Fi", "Drama"],
        dateCompleted: "2021-01-01",
        notes: "Are you watching closely? Brilliant dual-protagonist thriller.",
      });

      expect(historicalMovie).toBeDefined();
      expect(historicalMovie.title).toBe("The Prestige");
      expect(historicalMovie.type).toBe("movie");
      expect(historicalMovie.releaseYear).toBe(2006);
      expect(historicalMovie.rating).toBe(9.6);
      expect(historicalMovie.isHistorical).toBe(true);
      expect(historicalMovie.dateCompleted).toBe("2021-01-01");
      expect(historicalMovie.notes).toContain("Are you watching closely?");

      // Verify it appears in full archive
      const all = await DatabaseClient.getArchiveData("all");
      const found = all.find((i) => i.title === "The Prestige");
      expect(found).toBeDefined();
      expect(found?.isHistorical).toBe(true);
    });

    it("adds a historical series with seasons and episode counts", async () => {
      const historicalSeries = await DatabaseClient.addHistoricalEntry({
        itemType: "series",
        title: "Dark",
        releaseYear: 2017,
        rating: 9.8,
        genres: ["Sci-Fi", "Mystery", "Thriller"],
        dateCompleted: "2020-07-15",
        totalSeasons: 3,
        totalEpisodes: 26,
        notes: "The end is the beginning, and the beginning is the end.",
      });

      expect(historicalSeries).toBeDefined();
      expect(historicalSeries.title).toBe("Dark");
      expect(historicalSeries.type).toBe("series");
      expect(historicalSeries.totalSeasons).toBe(3);
      expect(historicalSeries.totalEpisodes).toBe(26);
      expect(historicalSeries.isHistorical).toBe(true);

      const all = await DatabaseClient.getArchiveData("all");
      const found = all.find((i) => i.title === "Dark");
      expect(found).toBeDefined();
      expect(found?.totalSeasons).toBe(3);
    });
  });

  // =============================================================
  // 3. Duplicate Prevention Checks
  // =============================================================
  describe("Duplicate Prevention", () => {
    it("detects existing archive duplicates by title and release year", async () => {
      const isDup = await DatabaseClient.checkArchiveDuplicate("The Prestige", 2006, "movie");
      expect(isDup).toBe(true);

      const notDup = await DatabaseClient.checkArchiveDuplicate("Brand New Movie", 2026, "movie");
      expect(notDup).toBe(false);
    });

    it("rejects adding an identical duplicate entry", async () => {
      let threw = false;
      try {
        await DatabaseClient.addHistoricalEntry({
          itemType: "movie",
          title: "The Prestige",
          releaseYear: 2006,
          rating: 8.0,
        });
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain("already exists");
      }
      expect(threw).toBe(true);
    });
  });

  // =============================================================
  // 4. Editing & Deleting Archived Records
  // =============================================================
  describe("Archive Record Editing & Deletion", () => {
    it("updates rating, completion date, and notes of an archived record", async () => {
      const allBefore = await DatabaseClient.getArchiveData("all");
      const target = allBefore.find((i) => i.title === "The Prestige")!;

      const ok = await DatabaseClient.updateArchivedEntry({
        id: target.id,
        itemType: target.type,
        title: "The Prestige (Director's Cut)",
        releaseYear: 2006,
        rating: 9.9,
        dateCompleted: "2021-06-20",
        notes: "Rewatched in 4K HDR. Absolute perfection.",
        genres: ["Mystery", "Sci-Fi", "Drama", "Psychological"],
      });
      expect(ok).toBe(true);

      const allAfter = await DatabaseClient.getArchiveData("all");
      const updated = allAfter.find((i) => i.id === target.id);
      expect(updated?.title).toBe("The Prestige (Director's Cut)");
      expect(updated?.rating).toBe(9.9);
      expect(updated?.dateCompleted).toBe("2021-06-20");
      expect(updated?.notes).toContain("Rewatched in 4K HDR");
      expect(updated?.genres).toContain("Psychological");
    });

    it("deletes an archived record permanently", async () => {
      const allBefore = await DatabaseClient.getArchiveData("all");
      const target = allBefore.find((i) => i.title.includes("The Prestige"))!;

      const ok = await DatabaseClient.deleteArchivedEntry(target.id, target.type);
      expect(ok).toBe(true);

      const allAfter = await DatabaseClient.getArchiveData("all");
      expect(allAfter.find((i) => i.id === target.id)).toBeUndefined();
    });
  });

  // =============================================================
  // 5. UI Component Integration
  // =============================================================
  describe("ArchivePage UI Integration", () => {
    it("renders ArchivePage with guarantee banner, KPI summary, search, and type tabs", () => {
      const { getByText, getByPlaceholderText, container } = render(<ArchivePage />);

      expect(container).toHaveTextContent("Entertainment Archive");
      expect(container).toHaveTextContent("Permanent Preservation");
      expect(container).toHaveTextContent("Total Completed Titles");
      expect(container).toHaveTextContent("Movies Finished");
      expect(container).toHaveTextContent("Series Finished");
      expect(container).toHaveTextContent("Average Personal Rating");

      expect(getByText("Add Historical Entry")).toBeDefined();
      expect(getByPlaceholderText("Search archive by title, genre, or notes...")).toBeDefined();

      expect(container).toHaveTextContent("All Media");
      expect(container).toHaveTextContent("Movies");
      expect(container).toHaveTextContent("TV Series");
    });
  });
});
