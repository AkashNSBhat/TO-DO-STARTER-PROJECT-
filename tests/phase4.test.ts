import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { SeriesPage } from "../src/pages/SeriesPage";

describe("Phase 4 — Series & Episode Tracker Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Series Creation & Hierarchy Lifecycle
  // =============================================================
  describe("Series Creation & Multi-Season Configuration", () => {
    it("creates a new series with per-season episode counts and auto-generated episode lists", async () => {
      const created = await DatabaseClient.createSeries({
        title: "Severance: Test Protocol",
        releaseYear: 2022,
        status: "watching",
        genres: ["Sci-Fi", "Mystery", "Thriller"],
        notes: "Lumon Industries macrodata refinement tracking",
        seasons: [
          {
            seasonNumber: 1,
            episodeCount: 3,
            episodeTitles: ["Good News About Hell", "Half Loop", "In Perpetuity"],
          },
          {
            seasonNumber: 2,
            episodeCount: 2,
          },
        ],
      });

      expect(created).toBeDefined();
      expect(created.title).toBe("Severance: Test Protocol");
      expect(created.releaseYear).toBe(2022);
      expect(created.totalSeasons).toBe(2);
      expect(created.totalEpisodes).toBe(5);
      expect(created.completedEpisodes).toBe(0);
      expect(created.seasons.length).toBe(2);

      // Verify Season 1
      const s1 = created.seasons[0];
      expect(s1.seasonNumber).toBe(1);
      expect(s1.episodes.length).toBe(3);
      expect(s1.episodes[0].title).toBe("Good News About Hell");
      expect(s1.episodes[1].title).toBe("Half Loop");
      expect(s1.episodes[2].title).toBe("In Perpetuity");

      // Verify Season 2 default episode naming
      const s2 = created.seasons[1];
      expect(s2.seasonNumber).toBe(2);
      expect(s2.episodes.length).toBe(2);
      expect(s2.episodes[0].title).toBe("Episode 1");
      expect(s2.episodes[1].title).toBe("Episode 2");
    });

    it("retrieves full series detail with all nested seasons and episodes", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      expect(target).toBeDefined();

      const detail = await DatabaseClient.getSeriesDetail(target.id);
      expect(detail.id).toBe(target.id);
      expect(detail.seasons.length).toBe(2);
      expect(detail.seasons[0].episodes.length).toBe(3);
    });

    it("renames an individual episode title", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);

      const targetEp = detail.seasons[1].episodes[0]; // Season 2 Episode 1
      const ok = await DatabaseClient.updateEpisodeTitle(targetEp.id, "Hello Ms. Cobel");
      expect(ok).toBe(true);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      const updatedEp = refreshed.seasons[1].episodes[0];
      expect(updatedEp.title).toBe("Hello Ms. Cobel");
    });
  });

  // =============================================================
  // 2. Episode Completion & Cumulative Progress Tracking
  // =============================================================
  describe("Episode Watching & Automatic Series Completion", () => {
    it("toggles episode completion state and preserves timestamps", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);
      const ep1 = detail.seasons[0].episodes[0];

      const res = await DatabaseClient.toggleEpisodeCompletion(ep1.id, true);
      expect(res.isCompleted).toBe(true);
      expect(res.seriesCompleted).toBe(false);
      expect(res.completedEpisodes).toBe(1);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.completedEpisodes).toBe(1);
      expect(refreshed.seasons[0].episodes[0].isCompleted).toBe(true);
      expect(refreshed.seasons[0].episodes[0].completedAt).toBeDefined();
    });

    it("triggers automatic series completion when all episodes are checked", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);

      // Check all remaining episodes (Season 1 ep 2, 3 and Season 2 ep 1, 2)
      for (const season of detail.seasons) {
        for (const ep of season.episodes) {
          if (!ep.isCompleted) {
            await DatabaseClient.toggleEpisodeCompletion(ep.id, true);
          }
        }
      }

      // Check the final episode toggle result
      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.completedEpisodes).toBe(refreshed.totalEpisodes);
      expect(refreshed.status).toBe("completed");

      // Verify in series summary list
      const summaryList = await DatabaseClient.getSeries();
      const summary = summaryList.find((s) => s.id === target.id);
      expect(summary?.status).toBe("completed");
    });

    it("reverts series status back to watching when an episode is unchecked", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);
      const firstEp = detail.seasons[0].episodes[0];

      // Uncheck first episode
      const res = await DatabaseClient.toggleEpisodeCompletion(firstEp.id, false);
      expect(res.isCompleted).toBe(false);
      expect(res.seriesCompleted).toBe(false);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.status).toBe("watching");
    });

    it("rates a series out of 10 upon completion", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;

      const rated = await DatabaseClient.rateSeries(target.id, 9.7);
      expect(rated).toBe(true);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.rating).toBe(9.7);
    });
  });

  // =============================================================
  // 3. Dynamic Season & Episode Adjustments
  // =============================================================
  describe("Dynamic Season & Episode Adjustments", () => {
    it("adds a new season dynamically to the series", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;

      const newSeason = await DatabaseClient.addSeason(target.id, 4);
      expect(newSeason).toBeDefined();
      expect(newSeason.seasonNumber).toBe(3);
      expect(newSeason.episodes.length).toBe(4);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.totalSeasons).toBe(3);
      expect(refreshed.totalEpisodes).toBe(9); // 5 previous + 4 new
    });

    it("adds an episode dynamically to a specific season", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);
      const s1 = detail.seasons[0];

      const newEp = await DatabaseClient.addEpisode(s1.id, "The Grim Barbarity of Optics");
      expect(newEp).toBeDefined();
      expect(newEp.title).toBe("The Grim Barbarity of Optics");
      expect(newEp.isCompleted).toBe(false);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.totalEpisodes).toBe(10);
      expect(refreshed.seasons[0].episodes.length).toBe(4);
    });

    it("deletes an episode while preserving progress on remaining episodes", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);
      const s1 = detail.seasons[0];
      const epToDelete = s1.episodes[s1.episodes.length - 1]; // last ep

      const deleted = await DatabaseClient.deleteEpisode(epToDelete.id);
      expect(deleted).toBe(true);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.totalEpisodes).toBe(9);
      expect(refreshed.seasons[0].episodes.find((e) => e.id === epToDelete.id)).toBeUndefined();
    });

    it("deletes a season dynamically", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;
      const detail = await DatabaseClient.getSeriesDetail(target.id);
      const seasonToDelete = detail.seasons[2]; // Season 3

      const deleted = await DatabaseClient.deleteSeason(seasonToDelete.id);
      expect(deleted).toBe(true);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.totalSeasons).toBe(2);
    });
  });

  // =============================================================
  // 4. Series Metadata Update & Permanent Deletion
  // =============================================================
  describe("Series Update & Deletion", () => {
    it("updates series metadata including synopsis, genres, and release year", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Test Protocol")!;

      const ok = await DatabaseClient.updateSeries({
        id: target.id,
        title: "Severance: Complete Edition",
        releaseYear: 2023,
        status: "watching",
        rating: 9.9,
        notes: "Updated synopsis text for verified season pass.",
        genres: ["Sci-Fi", "Dystopian", "Psychological"],
      });
      expect(ok).toBe(true);

      const refreshed = await DatabaseClient.getSeriesDetail(target.id);
      expect(refreshed.title).toBe("Severance: Complete Edition");
      expect(refreshed.releaseYear).toBe(2023);
      expect(refreshed.rating).toBe(9.9);
      expect(refreshed.genres).toContain("Dystopian");
    });

    it("deletes series permanently", async () => {
      const allSeries = await DatabaseClient.getSeries();
      const target = allSeries.find((s) => s.title === "Severance: Complete Edition")!;

      const deleted = await DatabaseClient.deleteSeries(target.id);
      expect(deleted).toBe(true);

      const afterList = await DatabaseClient.getSeries();
      expect(afterList.find((s) => s.id === target.id)).toBeUndefined();
    });
  });

  // =============================================================
  // 5. UI Component Integration
  // =============================================================
  describe("SeriesPage UI Integration", () => {
    it("renders SeriesPage with header, action buttons, and status tabs", () => {
      const { getByText, getByPlaceholderText, container } = render(<SeriesPage />);

      expect(container).toHaveTextContent("Series & Episode Tracker");
      expect(getByText("Add Series")).toBeDefined();
      expect(getByPlaceholderText("Search series by title or genre...")).toBeDefined();

      expect(container).toHaveTextContent("All");
      expect(container).toHaveTextContent("Watching");
      expect(container).toHaveTextContent("Completed");
      expect(container).toHaveTextContent("Planned");
    });
  });
});
