import React from "react";
import { describe, it, expect, vi, render } from "./test-utils";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { MoviesPage } from "../src/pages/MoviesPage";

describe("Phase 3 — Movie Tracker Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Movie CRUD & Status Lifecycle
  // =============================================================
  describe("Movie Creation, Update, and Deletion Lifecycle", () => {
    it("creates a new movie with all metadata and multi-genres", async () => {
      const created = await DatabaseClient.createMovie({
        title: "Inception: Remastered",
        releaseYear: 2010,
        status: "planned",
        genres: ["Sci-Fi", "Action", "Thriller"],
        rating: 9.3,
        notes: "Masterpiece by Christopher Nolan",
        posterColor: "#8b5cf6",
      });

      expect(created).toBeDefined();
      expect(created.title).toBe("Inception: Remastered");
      expect(created.releaseYear).toBe(2010);
      expect(created.status).toBe("planned");
      expect(created.genres).toContain("Sci-Fi");
      expect(created.genres).toContain("Action");
      expect(created.rating).toBe(9.3);
      expect(created.notes).toBe("Masterpiece by Christopher Nolan");
    });

    it("retrieves the movie in the library list", async () => {
      const movies = await DatabaseClient.getMovies("all");
      const found = movies.find((m) => m.title === "Inception: Remastered");
      expect(found).toBeDefined();
      expect(found?.releaseYear).toBe(2010);
      expect(found?.status).toBe("planned");
    });

    it("transitions movie status from planned to watching and completed", async () => {
      const movies = await DatabaseClient.getMovies("all");
      const target = movies.find((m) => m.title === "Inception: Remastered")!;

      // Step 1: Planned -> Watching
      const updatedToWatching = await DatabaseClient.updateMovie({
        id: target.id,
        title: target.title,
        releaseYear: target.releaseYear,
        status: "watching",
        genres: target.genres,
        rating: target.rating,
        notes: target.notes,
      });
      expect(updatedToWatching).toBe(true);

      const listAfterWatching = await DatabaseClient.getMovies("watching");
      const watchingFound = listAfterWatching.find((m) => m.id === target.id);
      expect(watchingFound).toBeDefined();
      expect(watchingFound?.status).toBe("watching");

      // Step 2: Watching -> Completed with dateWatched
      const updatedToCompleted = await DatabaseClient.updateMovie({
        id: target.id,
        title: target.title,
        releaseYear: target.releaseYear,
        status: "completed",
        rating: 9.5,
        dateWatched: "2026-11-17",
        genres: target.genres,
        notes: "Even better on rewatch!",
      });
      expect(updatedToCompleted).toBe(true);

      const listAfterCompleted = await DatabaseClient.getMovies("completed");
      const completedFound = listAfterCompleted.find((m) => m.id === target.id);
      expect(completedFound).toBeDefined();
      expect(completedFound?.status).toBe("completed");
      expect(completedFound?.rating).toBe(9.5);
      expect(completedFound?.dateWatched).toBe("2026-11-17");
    });

    it("updates movie details including genres and posterUrl", async () => {
      const movies = await DatabaseClient.getMovies("all");
      const target = movies.find((m) => m.title === "Inception: Remastered")!;

      const success = await DatabaseClient.updateMovie({
        id: target.id,
        title: "Inception: 4K HDR Edition",
        releaseYear: 2010,
        status: "completed",
        rating: 9.8,
        dateWatched: "2026-11-17",
        genres: ["Sci-Fi", "Mystery", "Mind-Bending"],
        posterUrl: "https://example.com/inception.jpg",
        notes: "Definitive home theater audio experience.",
      });
      expect(success).toBe(true);

      const refreshed = await DatabaseClient.getMovies("all");
      const updated = refreshed.find((m) => m.id === target.id);
      expect(updated?.title).toBe("Inception: 4K HDR Edition");
      expect(updated?.rating).toBe(9.8);
      expect(updated?.genres).toContain("Mind-Bending");
      expect(updated?.posterUrl).toBe("https://example.com/inception.jpg");
    });

    it("deletes a movie permanently", async () => {
      const moviesBefore = await DatabaseClient.getMovies("all");
      const target = moviesBefore.find((m) => m.title.includes("Inception"))!;

      const deleted = await DatabaseClient.deleteMovie(target.id);
      expect(deleted).toBe(true);

      const moviesAfter = await DatabaseClient.getMovies("all");
      const found = moviesAfter.find((m) => m.id === target.id);
      expect(found).toBeUndefined();
    });
  });

  // =============================================================
  // 2. Genre Collection & Filtering
  // =============================================================
  describe("Genres & Categorization", () => {
    it("fetches all distinct genres across the movie library", async () => {
      const genres = await DatabaseClient.getAllGenres();
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThan(0);
      expect(genres).toContain("Sci-Fi");
      expect(genres).toContain("Action");
    });

    it("filters movies by status properly", async () => {
      const planned = await DatabaseClient.getMovies("planned");
      for (const m of planned) {
        expect(m.status).toBe("planned");
      }

      const watching = await DatabaseClient.getMovies("watching");
      for (const m of watching) {
        expect(m.status).toBe("watching");
      }

      const completed = await DatabaseClient.getMovies("completed");
      for (const m of completed) {
        expect(m.status).toBe("completed");
      }
    });
  });

  // =============================================================
  // 3. UI Component Integration
  // =============================================================
  describe("MoviesPage UI Integration", () => {
    it("renders MoviesPage with header, search, and action buttons", () => {
      const { getByText, getByPlaceholderText, container } = render(<MoviesPage />);

      // Verify page titles and action buttons
      expect(container).toHaveTextContent("Movie Tracker");
      expect(getByText("Add Movie")).toBeDefined();
      expect(getByPlaceholderText("Search by title, notes, or genre...")).toBeDefined();

      // Verify filter tabs exist
      expect(container).toHaveTextContent("All");
      expect(container).toHaveTextContent("Watching");
      expect(container).toHaveTextContent("Planned");
      expect(container).toHaveTextContent("Completed");
    });

    it("renders sorting and genre filter options", () => {
      const { container } = render(<MoviesPage />);

      expect(container).toHaveTextContent("All Genres");
      expect(container).toHaveTextContent("Rating (Highest)");
      expect(container).toHaveTextContent("Year (Newest)");
    });
  });
});
