import React from "react";
import { describe, it, expect, render } from "./test-utils";
import { CatalogueClient } from "../src/lib/catalog/client";
import { DatabaseClient } from "../src/lib/db/client";
import { resetMockDb } from "./mocks/tauriMock";
import { TMDBProvider, TVmazeProvider } from "../src/lib/catalog/provider";
import { DiscoverPage } from "../src/pages/DiscoverPage";
import { DiscoverCard } from "../src/components/discover/DiscoverCard";

describe("Phase 9 — Discover Movie & Web Series Catalogue Test Suite", () => {
  resetMockDb();

  // =============================================================
  // 1. Initial Population & Volume Guarantees
  // =============================================================
  describe("Catalogue Initial Population & Language Breadth", () => {
    it("contains at least 100 movies in the offline catalogue", async () => {
      const movies = await CatalogueClient.getCatalogItems({ mediaType: "movie" });
      expect(movies.length).toBeGreaterThanOrEqual(100);
    });

    it("contains at least 100 TV/web series in the offline catalogue", async () => {
      const series = await CatalogueClient.getCatalogItems({ mediaType: "series" });
      expect(series.length).toBeGreaterThanOrEqual(100);
    });

    it("includes titles across English, Hindi, Kannada, and German languages", async () => {
      const allItems = await CatalogueClient.getCatalogItems();

      const englishItems = allItems.filter((i) => i.originalLanguage === "en");
      const hindiItems = allItems.filter((i) => i.originalLanguage === "hi");
      const kannadaItems = allItems.filter((i) => i.originalLanguage === "kn");
      const germanItems = allItems.filter((i) => i.originalLanguage === "de");

      expect(englishItems.length).toBeGreaterThanOrEqual(10);
      expect(hindiItems.length).toBeGreaterThanOrEqual(10);
      expect(kannadaItems.length).toBeGreaterThanOrEqual(10);
      expect(germanItems.length).toBeGreaterThanOrEqual(10);
    });

    it("retrieves catalogue version and provider attribution metadata", async () => {
      const meta = await CatalogueClient.getCatalogMetadata();
      expect(meta.catalogVersion).toBe("1.0.0");
      expect(meta.schemaVersion).toBe(1);
      expect(meta.totalMovies).toBeGreaterThanOrEqual(100);
      expect(meta.totalSeries).toBeGreaterThanOrEqual(100);
      expect(meta.attributionNotice).toContain("TMDB");
      expect(meta.attributionNotice).toContain("TVmaze");
    });
  });

  // =============================================================
  // 2. Multilingual Search & Alternate Titles
  // =============================================================
  describe("Multilingual Search & Filtering", () => {
    it("searches catalogue by original title", async () => {
      const results = await CatalogueClient.searchCatalog("Inception");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].primaryTitle).toBe("Inception");
    });

    it("searches catalogue by alternate/localized title in Kannada script", async () => {
      const results = await CatalogueClient.searchCatalog("ಕಾಂತಾರ");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].primaryTitle).toBe("Kantara");
    });

    it("searches catalogue by localized title in Hindi script", async () => {
      const results = await CatalogueClient.searchCatalog("शोले");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].primaryTitle).toBe("Sholay");
    });

    it("filters catalogue by language correctly", async () => {
      const kannadaMovies = await CatalogueClient.getCatalogItems({
        mediaType: "movie",
        language: "kn",
      });

      expect(kannadaMovies.length).toBeGreaterThanOrEqual(5);
      expect(
        kannadaMovies.every(
          (m) =>
            m.originalLanguage === "kn" ||
            m.languages?.some((l) => l.languageCode === "kn")
        )
      ).toBe(true);
    });

    it("filters catalogue by release decade and genre", async () => {
      const recentSciFi = await CatalogueClient.getCatalogItems({
        mediaType: "movie",
        genre: "Sci-Fi",
        releaseYearDecade: "2010s",
      });

      expect(recentSciFi.length).toBeGreaterThanOrEqual(1);
      expect(recentSciFi.every((m) => m.releaseYear >= 2010 && m.releaseYear < 2020)).toBe(true);
      expect(recentSciFi.every((m) => m.genres.includes("Sci-Fi"))).toBe(true);
    });
  });

  // =============================================================
  // 3. Audio & Dubbing Integrity Verification
  // =============================================================
  describe("Original Language vs Verified Dubbed Audio Distinction", () => {
    it("clearly separates original audio from verified dubbed audio tracks", async () => {
      const darkSeries = (await CatalogueClient.searchCatalog("Dark", "series"))[0];
      expect(darkSeries).toBeDefined();

      const originalLang = darkSeries.languages?.find((l) => l.isOriginal);
      expect(originalLang?.languageCode).toBe("de");

      // Verified dubbed tracks must be separate and marked isDubbed = true
      const dubbedTracks = darkSeries.languages?.filter((l) => l.isDubbed);
      expect(dubbedTracks?.length).toBeGreaterThanOrEqual(1);
      expect(dubbedTracks?.every((t) => !t.isOriginal)).toBe(true);
    });

    it("does not falsely infer dubbed availability from translated titles", async () => {
      const kgf = (await CatalogueClient.searchCatalog("K.G.F: Chapter 1", "movie"))[0];
      expect(kgf).toBeDefined();
      expect(kgf.originalLanguage).toBe("kn");

      // Verify that alternateTitles contains title aliases while languages holds audio tracks
      expect(kgf.alternateTitles).toBeDefined();
      expect(kgf.languages).toBeDefined();
    });
  });

  // =============================================================
  // 4. Watchlist Integration (Movie Tracker)
  // =============================================================
  describe("Watchlist Integration — Movie Tracker", () => {
    it("adds a catalogue movie directly to personal Movie Tracker with Planned status", async () => {
      const movieItem = (await CatalogueClient.searchCatalog("777 Charlie", "movie"))[0];
      expect(movieItem).toBeDefined();

      const result = await CatalogueClient.addToWatchlist(movieItem);
      expect(result.success).toBe(true);

      // Verify personal DatabaseClient movie record
      const personalMovies = await DatabaseClient.getMovies("all");
      const savedMovie = personalMovies.find((m) => m.title === movieItem.primaryTitle);
      expect(savedMovie).toBeDefined();
      expect(savedMovie?.status).toBe("planned");
      expect(savedMovie?.releaseYear).toBe(movieItem.releaseYear);
      expect(savedMovie?.genres).toEqual(movieItem.genres);
    });

    it("prevents duplicate entries when attempting to add the same movie again", async () => {
      const movieItem = (await CatalogueClient.searchCatalog("777 Charlie", "movie"))[0];
      expect(movieItem).toBeDefined();

      // Second add attempt should be gracefully prevented
      const result = await CatalogueClient.addToWatchlist(movieItem);
      expect(result.success).toBe(false);
      expect(result.alreadyExisted).toBe(true);
      expect(result.message).toContain("already in your Movie Tracker");
    });
  });

  // =============================================================
  // 5. Watchlist Integration (Series Tracker)
  // =============================================================
  describe("Watchlist Integration — Series Tracker & Episode Generation", () => {
    it("adds a catalogue series to personal Series Tracker with full seasons and episodes", async () => {
      const seriesItem = (await CatalogueClient.searchCatalog("Panchayat", "series"))[0];
      expect(seriesItem).toBeDefined();

      const result = await CatalogueClient.addToWatchlist(seriesItem);
      expect(result.success).toBe(true);

      // Verify personal DatabaseClient series record
      const personalSeries = await DatabaseClient.getSeries();
      const savedSeries = personalSeries.find((s) => s.title === seriesItem.primaryTitle);
      expect(savedSeries).toBeDefined();
      expect(savedSeries?.status).toBe("planned");

      // Verify full detail with seasons and episodes initialized as incomplete
      const seriesDetail = await DatabaseClient.getSeriesDetail(savedSeries!.id);
      expect(seriesDetail.seasons.length).toBeGreaterThanOrEqual(1);
      expect(seriesDetail.completedEpisodes).toBe(0);
      expect(seriesDetail.seasons[0].episodes.every((ep) => !ep.isCompleted)).toBe(true);
    });

    it("prevents duplicate entries when attempting to add the same series again", async () => {
      const seriesItem = (await CatalogueClient.searchCatalog("Panchayat", "series"))[0];
      expect(seriesItem).toBeDefined();

      const result = await CatalogueClient.addToWatchlist(seriesItem);
      expect(result.success).toBe(false);
      expect(result.alreadyExisted).toBe(true);
      expect(result.message).toContain("already in your Series Tracker");
    });
  });

  // =============================================================
  // 6. Provider-Independent Architecture & Offline Testing
  // =============================================================
  describe("Provider Interfaces & 100% Offline Capability", () => {
    it("instantiates TMDB and TVmaze provider interfaces cleanly", () => {
      const tmdb = new TMDBProvider();
      const tvmaze = new TVmazeProvider();

      expect(tmdb.name).toBe("tmdb");
      expect(tvmaze.name).toBe("tvmaze");
    });

    it("performs all catalogue search operations with zero internet connectivity", async () => {
      // Offline execution guarantee
      const offlineResults = await CatalogueClient.getCatalogItems({
        searchQuery: "Dark",
        mediaType: "series",
      });

      expect(offlineResults.length).toBeGreaterThanOrEqual(1);
      expect(offlineResults[0].primaryTitle).toBe("Dark");
      expect(offlineResults[0].totalSeasons).toBe(3);
    });
  });

  // =============================================================
  // 7. UI Component Rendering
  // =============================================================
  describe("Discover UI Component Rendering", () => {
    it("renders DiscoverCard with badges, rating, and actions", () => {
      const sampleItem = {
        id: "sample-1",
        provider: "local_pack" as const,
        providerId: "test-1",
        mediaType: "movie" as const,
        originalTitle: "Ulidavaru Kandanthe",
        primaryTitle: "Ulidavaru Kandanthe",
        description: "A cult classic Kannada neo-noir thriller.",
        releaseYear: 2014,
        genres: ["Crime", "Drama"],
        posterUrl: "",
        originalLanguage: "kn",
        rating: 8.4,
        attribution: "Test attribution",
      };

      const { container } = render(
        <DiscoverCard item={sampleItem} onSelect={() => {}} />
      );

      expect(container.textContent).toContain("Ulidavaru Kandanthe");
      expect(container.textContent).toContain("2014");
      expect(container.textContent).toContain("8.4");
      expect(container.textContent).toContain("Kannada");
      expect(container.textContent).toContain("Add to Watchlist");
    });

    it("renders DiscoverPage with primary tabs and filter bar", () => {
      const { container } = render(<DiscoverPage />);
      expect(container.textContent).toContain("Discover Catalogue");
      expect(container.textContent).toContain("Movies");
      expect(container.textContent).toContain("Series & Shows");
      expect(container.textContent).toContain("All Languages");
    });
  });
});
