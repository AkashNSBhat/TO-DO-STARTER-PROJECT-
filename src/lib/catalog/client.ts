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

export class CatalogueClient {
  private static localCatalog: MediaCatalogItem[] = [...ALL_SEED_CATALOG];
  private static metadata: CatalogMetadata = { ...CATALOG_METADATA };

  /**
   * Returns catalog metadata, versioning, and provider info
   */
  static async getCatalogMetadata(): Promise<CatalogMetadata> {
    return {
      ...this.metadata,
      totalMovies: this.localCatalog.filter((i) => i.mediaType === "movie").length,
      totalSeries: this.localCatalog.filter((i) => i.mediaType === "series").length,
    };
  }

  /**
   * Retrieves items with multi-criteria filtering and sorting
   */
  static async getCatalogItems(
    options: CatalogFilterOptions = {}
  ): Promise<MediaCatalogItem[]> {
    let items = [...this.localCatalog];

    // Filter by Media Type (movie / series)
    if (options.mediaType) {
      items = items.filter((item) => item.mediaType === options.mediaType);
    }

    // Filter by Search Query (across primary title, original title, alternate titles, genres)
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
    }

    // Filter by Language
    if (options.language && options.language !== "all") {
      const lang = options.language.toLowerCase();
      items = items.filter((item) => {
        // Matches original language or available audio languages
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
   * Find item by ID
   */
  static async getCatalogItemById(id: string): Promise<MediaCatalogItem | null> {
    const item = this.localCatalog.find((i) => i.id === id);
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

      if (item.mediaType === "movie") {
        const createdMovie = await DatabaseClient.createMovie({
          title: item.primaryTitle,
          releaseYear: item.releaseYear,
          status: "planned",
          genres: item.genres,
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
              episodeCount: s.episodeCount,
              episodeTitles: s.episodes?.map((e) => e.title) || [],
            }))
          : [
              {
                seasonNumber: 1,
                episodeCount: 8,
                episodeTitles: [],
              },
            ];

        const createdSeries = await DatabaseClient.createSeries({
          title: item.primaryTitle,
          releaseYear: item.releaseYear,
          status: "planned",
          genres: item.genres,
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
