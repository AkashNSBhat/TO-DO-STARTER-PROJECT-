import {
  MediaCatalogItem,
  CatalogMetadata,
  CatalogFilterOptions,
  CatalogMediaType,
} from "./types";
import { DatabaseClient } from "../db/client";
import { TMDBProvider } from "./provider";
import { CatalogueDatabase, CatalogueStats } from "./database";

export class CatalogueClient {
  private static tmdbProvider: TMDBProvider = new TMDBProvider();

  /**
   * Set or update TMDB API Key at runtime
   */
  static setTmdbApiKey(key: string): void {
    this.tmdbProvider.setApiKey(key);
  }

  /**
   * Check if TMDB API is active and configured
   */
  static hasTmdbApiKey(): boolean {
    return this.tmdbProvider.hasApiKey();
  }

  /**
   * Get current TMDB API key
   */
  static getTmdbApiKey(): string {
    return this.tmdbProvider.getApiKey();
  }

  /**
   * Returns catalog metadata, versioning, and provider info
   */
  static async getCatalogMetadata(): Promise<CatalogMetadata> {
    const meta = CatalogueDatabase.getMetadata();
    return {
      ...meta,
      provider: this.tmdbProvider.hasApiKey()
        ? "TMDB Live API + Offline SQLite Catalogue"
        : "TMDB & TVmaze Compatible Local Catalogue (Offline)",
    };
  }

  /**
   * Returns detailed database stats (counts of movies, series, seasons, episodes, size)
   */
  static async getStats(): Promise<CatalogueStats> {
    return CatalogueDatabase.getStats();
  }

  /**
   * Reset catalogue to clean baseline seed pack
   */
  static resetCatalog(): void {
    CatalogueDatabase.reset();
  }

  /**
   * Retrieves items with multi-criteria filtering, sorting, and live TMDB integration
   */
  static async getCatalogItems(
    options: CatalogFilterOptions = {},
    pagination?: { page: number; pageSize: number }
  ): Promise<MediaCatalogItem[]> {
    // If the user has typed an active search query and TMDB API key is active, query live TMDB in background
    if (
      this.tmdbProvider.hasApiKey() &&
      options.searchQuery &&
      options.searchQuery.trim().length >= 2
    ) {
      try {
        const tmdbMedia = options.mediaType || "movie";
        const tmdbResults = await this.tmdbProvider.search(
          options.searchQuery.trim(),
          tmdbMedia,
          options.language || "en"
        );

        const newItems: MediaCatalogItem[] = [];
        for (const res of tmdbResults) {
          const catalogId = `cat-tmdb-${res.mediaType}-${res.providerId}`;
          const existing = CatalogueDatabase.getItemByProviderId("tmdb", res.providerId);

          if (!existing) {
            newItems.push({
              id: catalogId,
              provider: "tmdb",
              providerId: res.providerId,
              mediaType: res.mediaType,
              originalTitle: res.originalTitle,
              primaryTitle: res.title,
              description: res.overview,
              releaseYear: res.releaseYear,
              genres: [],
              posterUrl: res.posterUrl,
              originalLanguage: res.originalLanguage,
              rating: res.rating,
              attribution: "Metadata provided by TMDB. Live query via API key.",
              languages: [
                {
                  id: `${catalogId}-lang-${res.originalLanguage}`,
                  catalogId,
                  languageCode: res.originalLanguage,
                  languageName: res.originalLanguage.toUpperCase(),
                  isOriginal: true,
                  isDubbed: false,
                  hasSubtitles: true,
                },
              ],
              alternateTitles: [],
            });
          }
        }

        if (newItems.length > 0) {
          CatalogueDatabase.upsertBatch(newItems);
        }
      } catch (err) {
        console.warn("[CatalogueClient] Live TMDB search fallback to local database:", err);
      }
    }

    // Query from the fast offline local database
    const queryResult = CatalogueDatabase.query(
      options,
      pagination || { page: 1, pageSize: 10000 }
    );
    return queryResult.items;
  }

  /**
   * Find item by ID, enriching with live TMDB details and episodes if needed
   */
  static async getCatalogItemById(id: string): Promise<MediaCatalogItem | null> {
    let item = CatalogueDatabase.getItemById(id);

    // If item came from live TMDB search and needs rich details
    if (item && item.provider === "tmdb" && (!item.genres || item.genres.length === 0)) {
      if (this.tmdbProvider.hasApiKey()) {
        try {
          const fullDetails = await this.tmdbProvider.getDetails(item.providerId, item.mediaType);
          if (fullDetails) {
            if (fullDetails.mediaType === "series" && fullDetails.seasons && fullDetails.seasons.length > 0) {
              const s1 = fullDetails.seasons[0];
              const eps = await this.tmdbProvider.getSeasonEpisodes(item.providerId, s1.seasonNumber);
              s1.episodes = eps;
            }

            Object.assign(item, fullDetails);
            CatalogueDatabase.upsertItem(item);
          }
        } catch (err) {
          console.warn("[CatalogueClient] Failed to enrich TMDB item details:", err);
        }
      }
    }

    return item || null;
  }

  /**
   * Instant search across movies or series
   */
  static async searchCatalog(
    query: string,
    mediaType?: CatalogMediaType
  ): Promise<MediaCatalogItem[]> {
    return this.getCatalogItems({ searchQuery: query, mediaType });
  }

  /**
   * Check if a catalogue item is already present in the user's personal database
   */
  static async isItemInWatchlist(
    title: string,
    releaseYear: number,
    mediaType: CatalogMediaType
  ): Promise<boolean> {
    try {
      const normalizedTitle = title.trim().toLowerCase();
      if (mediaType === "movie") {
        const existingMovies = await DatabaseClient.getMovies("all");
        return existingMovies.some(
          (m) =>
            m.title.trim().toLowerCase() === normalizedTitle &&
            m.releaseYear === releaseYear
        );
      } else {
        const existingSeries = await DatabaseClient.getSeries();
        return existingSeries.some(
          (s) =>
            s.title.trim().toLowerCase() === normalizedTitle &&
            s.releaseYear === releaseYear
        );
      }
    } catch {
      return false;
    }
  }

  /**
   * Add a catalogue item to the user's personal Watchlist (Movie Tracker or Series Tracker)
   * Ensures Planned initial status, preserves progress, and prevents duplicates.
   */
  static async addToWatchlist(
    item: MediaCatalogItem
  ): Promise<{
    success: boolean;
    id?: string;
    message: string;
    alreadyExisted?: boolean;
  }> {
    try {
      const isDuplicate = await this.isItemInWatchlist(
        item.primaryTitle,
        item.releaseYear,
        item.mediaType
      );

      if (isDuplicate) {
        return {
          success: false,
          alreadyExisted: true,
          message: `"${item.primaryTitle}" is already in your ${
            item.mediaType === "movie" ? "Movie Tracker" : "Series Tracker"
          }!`,
        };
      }

      // If it's a TMDB item and details aren't enriched, fetch full details first
      if (item.provider === "tmdb" && (!item.genres || item.genres.length === 0)) {
        await this.getCatalogItemById(item.id);
      }

      if (item.mediaType === "movie") {
        const createdMovie = await DatabaseClient.createMovie({
          title: item.primaryTitle,
          releaseYear: item.releaseYear,
          status: "planned",
          genres: item.genres || [],
          posterUrl: item.posterUrl,
          notes: item.description,
        });

        return {
          success: true,
          id: createdMovie.id,
          message: `Added "${item.primaryTitle}" to your Movie Watchlist (Planned)!`,
        };
      } else {
        // Construct seasons for Series Tracker
        const seasons = (item.seasons && item.seasons.length > 0)
          ? item.seasons.map((s) => ({
              seasonNumber: s.seasonNumber,
              episodeCount: s.episodeCount || 8,
              episodeTitles: s.episodes?.map((e) => e.title) || [],
            }))
          : [
              {
                seasonNumber: 1,
                episodeCount: item.totalEpisodes || 8,
                episodeTitles: [],
              },
            ];

        const createdSeries = await DatabaseClient.createSeries({
          title: item.primaryTitle,
          releaseYear: item.releaseYear,
          status: "planned",
          genres: item.genres || [],
          posterUrl: item.posterUrl,
          notes: item.description,
          seasons,
        });

        return {
          success: true,
          id: createdSeries.id,
          message: `Added "${item.primaryTitle}" (${seasons.length} seasons) to your Series Tracker (Planned)!`,
        };
      }
    } catch (error) {
      console.error("[DAYMARK CatalogueClient] Failed to add to watchlist:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add item to watchlist.",
      };
    }
  }
}
