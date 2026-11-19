import {
  MediaCatalogItem,
  CatalogMetadata,
  CatalogFilterOptions,
  CatalogMediaType,
} from "./types";
import {
  ALL_SEED_CATALOG,
  CATALOG_METADATA,
} from "./seedCatalog";
import { DatabaseClient } from "../db/client";
import { TMDBProvider } from "./provider";

export class CatalogueClient {
  private static localCatalog: MediaCatalogItem[] = [...ALL_SEED_CATALOG];
  private static metadata: CatalogMetadata = { ...CATALOG_METADATA };
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
    return {
      ...this.metadata,
      totalMovies: this.localCatalog.filter((i) => i.mediaType === "movie").length,
      totalSeries: this.localCatalog.filter((i) => i.mediaType === "series").length,
      provider: this.tmdbProvider.hasApiKey()
        ? "TMDB Live API + Bundled Offline Pack"
        : "TMDB & TVmaze Compatible Local Pack (Offline)",
    };
  }

  /**
   * Retrieves items with multi-criteria filtering, sorting, and live TMDB integration
   */
  static async getCatalogItems(
    options: CatalogFilterOptions = {}
  ): Promise<MediaCatalogItem[]> {
    let items = [...this.localCatalog];

    // Filter by Media Type (movie / series)
    if (options.mediaType) {
      items = items.filter((item) => item.mediaType === options.mediaType);
    }

    // Filter by Search Query
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        if (item.primaryTitle.toLowerCase().includes(q)) return true;
        if (item.originalTitle.toLowerCase().includes(q)) return true;
        if (item.genres.some((g) => g.toLowerCase().includes(q))) return true;
        if (
          item.alternateTitles &&
          item.alternateTitles.some((alt) => alt.title.toLowerCase().includes(q))
        ) {
          return true;
        }
        return false;
      });

      // Live TMDB API Search Integration when API Key is active
      if (this.tmdbProvider.hasApiKey() && options.searchQuery.trim().length >= 2) {
        try {
          const tmdbMedia = options.mediaType || "movie";
          const tmdbResults = await this.tmdbProvider.search(
            options.searchQuery.trim(),
            tmdbMedia,
            options.language || "en"
          );

          for (const res of tmdbResults) {
            const catalogId = `cat-tmdb-${res.mediaType}-${res.providerId}`;

            // Check if already in items or localCatalog
            const alreadyPresent = items.some(
              (i) =>
                i.id === catalogId ||
                (i.primaryTitle.toLowerCase() === res.title.toLowerCase() &&
                  i.releaseYear === res.releaseYear)
            );

            if (!alreadyPresent) {
              const tmdbItem: MediaCatalogItem = {
                id: catalogId,
                provider: "tmdb",
                providerId: res.providerId,
                mediaType: res.mediaType,
                originalTitle: res.originalTitle,
                primaryTitle: res.title,
                description: res.overview,
                releaseYear: res.releaseYear,
                genres: [], // genres are enriched on detail inspection
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
              };

              items.push(tmdbItem);

              // Cache in local catalog for instant offline re-access
              if (!this.localCatalog.some((c) => c.id === catalogId)) {
                this.localCatalog.push(tmdbItem);
              }
            }
          }
        } catch (tmdbErr) {
          console.warn("[CatalogueClient] TMDB Live query fallback to offline pack:", tmdbErr);
        }
      }
    }

    // Filter by Language
    if (options.language && options.language !== "all") {
      const lang = options.language.toLowerCase();
      items = items.filter((item) => {
        if (item.originalLanguage.toLowerCase() === lang) return true;
        if (
          item.languages &&
          item.languages.some((l) => l.languageCode.toLowerCase() === lang)
        ) {
          return true;
        }
        return false;
      });
    }

    // Filter by Genre
    if (options.genre && options.genre !== "all") {
      const targetGenre = options.genre.toLowerCase();
      items = items.filter((item) =>
        item.genres.some((g) => g.toLowerCase() === targetGenre)
      );
    }

    // Filter by Release Year Decade
    if (options.releaseYearDecade && options.releaseYearDecade !== "all") {
      switch (options.releaseYearDecade) {
        case "2020s":
          items = items.filter((item) => item.releaseYear >= 2020);
          break;
        case "2010s":
          items = items.filter(
            (item) => item.releaseYear >= 2010 && item.releaseYear < 2020
          );
          break;
        case "2000s":
          items = items.filter(
            (item) => item.releaseYear >= 2000 && item.releaseYear < 2010
          );
          break;
        case "classics":
          items = items.filter((item) => item.releaseYear < 2000);
          break;
      }
    }

    // Sort items
    const sortBy = options.sortBy || "rating";
    items.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "year_desc":
          return b.releaseYear - a.releaseYear;
        case "year_asc":
          return a.releaseYear - b.releaseYear;
        case "title_asc":
          return a.primaryTitle.localeCompare(b.primaryTitle);
        default:
          return b.rating - a.rating;
      }
    });

    return items;
  }

  /**
   * Find item by ID, enriching with live TMDB details and episodes if needed
   */
  static async getCatalogItemById(id: string): Promise<MediaCatalogItem | null> {
    let item = this.localCatalog.find((i) => i.id === id);

    // If item came from live TMDB and needs full details (genres, seasons, episodes)
    if (item && item.provider === "tmdb" && (!item.genres || item.genres.length === 0)) {
      if (this.tmdbProvider.hasApiKey()) {
        try {
          const fullDetails = await this.tmdbProvider.getDetails(item.providerId, item.mediaType);
          if (fullDetails) {
            // If series, fetch Season 1 episodes as well
            if (fullDetails.mediaType === "series" && fullDetails.seasons && fullDetails.seasons.length > 0) {
              const s1 = fullDetails.seasons[0];
              const eps = await this.tmdbProvider.getSeasonEpisodes(item.providerId, s1.seasonNumber);
              s1.episodes = eps;
            }

            Object.assign(item, fullDetails);
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
