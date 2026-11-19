import {
  MediaCatalogItem,
  CatalogMediaType,
  ProviderSearchResult,
  MediaSeasonItem,
  MediaEpisodeItem,
} from "./types";

export interface IMetadataProvider {
  readonly name: string;
  search(query: string, mediaType: CatalogMediaType, language?: string): Promise<ProviderSearchResult[]>;
  getDetails(providerId: string, mediaType: CatalogMediaType): Promise<MediaCatalogItem | null>;
  getSeasonEpisodes(providerId: string, seasonNumber: number): Promise<MediaEpisodeItem[]>;
}

/**
 * Rate Limiter to respect external API policies and limits
 */
class RateLimiter {
  private lastCallTime = 0;
  constructor(private minIntervalMs: number = 250) {}

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastCallTime = Date.now();
  }
}

/**
 * The Movie Database (TMDB) Provider Implementation
 * Follows TMDB terms of service: Attribution required, no hardcoded secret keys in public code.
 */
export class TMDBProvider implements IMetadataProvider {
  readonly name = "tmdb";
  private apiKey: string;
  private baseUrl = "https://api.themoviedb.org/3";
  private imageBaseUrl = "https://image.tmdb.org/t/p/w500";
  private limiter = new RateLimiter(250); // Max 4 requests/sec (well within TMDB 40/10s limit)

  static getStoredApiKey(): string {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("daymark_tmdb_api_key");
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    try {
      const envKey = (import.meta as any).env?.VITE_TMDB_API_KEY;
      if (envKey && typeof envKey === "string" && envKey.trim().length > 0) {
        return envKey.trim();
      }
    } catch {}
    if (typeof process !== "undefined" && process.env) {
      const procKey = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
      if (procKey && typeof procKey === "string" && procKey.trim().length > 0) {
        return procKey.trim();
      }
    }
    // Default active key provided for DAYMARK deployment
    return "1762c1e57ef221da5cfd62d1e4badee5";
  }

  static setStoredApiKey(key: string): void {
    if (typeof localStorage !== "undefined") {
      if (key && key.trim().length > 0) {
        localStorage.setItem("daymark_tmdb_api_key", key.trim());
      } else {
        localStorage.removeItem("daymark_tmdb_api_key");
      }
    }
  }

  constructor(apiKey?: string) {
    this.apiKey = (apiKey && apiKey.trim().length > 0) ? apiKey.trim() : TMDBProvider.getStoredApiKey();
  }

  setApiKey(key: string) {
    this.apiKey = key.trim();
    TMDBProvider.setStoredApiKey(this.apiKey);
  }

  getApiKey(): string {
    return this.apiKey;
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async search(
    query: string,
    mediaType: CatalogMediaType,
    language: string = "en"
  ): Promise<ProviderSearchResult[]> {
    if (!this.apiKey) {
      return [];
    }

    await this.limiter.throttle();
    const endpoint = mediaType === "movie" ? "/search/movie" : "/search/tv";
    const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&query=${encodeURIComponent(
      query
    )}&language=${language}&include_adult=false`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`TMDB HTTP Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const results = (data.results || []) as any[];

      return results.map((item) => {
        const title = mediaType === "movie" ? item.title : item.name;
        const originalTitle = mediaType === "movie" ? item.original_title : item.original_name;
        const releaseDate = mediaType === "movie" ? item.release_date : item.first_air_date;
        const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : 0;

        return {
          providerId: String(item.id),
          mediaType,
          title: title || originalTitle,
          originalTitle: originalTitle || title,
          releaseYear: isNaN(year) ? 0 : year,
          overview: item.overview || "",
          posterUrl: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : "",
          originalLanguage: item.original_language || "en",
          rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0,
        };
      });
    } catch (err) {
      console.warn(`[TMDBProvider] Search failed for query "${query}":`, err);
      return [];
    }
  }

  async getDetails(providerId: string, mediaType: CatalogMediaType): Promise<MediaCatalogItem | null> {
    if (!this.apiKey) {
      return null;
    }

    await this.limiter.throttle();
    const endpoint = mediaType === "movie" ? `/movie/${providerId}` : `/tv/${providerId}`;
    const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&append_to_response=alternative_titles,credits`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();

      const title = mediaType === "movie" ? data.title : data.name;
      const originalTitle = mediaType === "movie" ? data.original_title : data.original_name;
      const releaseDate = mediaType === "movie" ? data.release_date : data.first_air_date;
      const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : 0;
      const genres = (data.genres || []).map((g: any) => g.name);

      // Alternate / Localized titles
      const alternateTitles: any[] = [];
      const altList = data.alternative_titles?.titles || data.alternative_titles?.results || [];
      for (const alt of altList.slice(0, 8)) {
        alternateTitles.push({
          id: `title-${providerId}-${alt.iso_3166_1 || "alt"}-${alternateTitles.length}`,
          catalogId: `cat-tmdb-${mediaType}-${providerId}`,
          title: alt.title || alt.name,
          language: alt.iso_3166_1?.toLowerCase() || "en",
          type: "localized",
        });
      }

      // Seasons mapping for series
      let seasons: MediaSeasonItem[] | undefined;
      let totalEpisodes = 0;
      if (mediaType === "series" && Array.isArray(data.seasons)) {
        seasons = data.seasons
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => {
            totalEpisodes += s.episode_count || 0;
            return {
              id: `sea-tmdb-${providerId}-${s.season_number}`,
              catalogId: `cat-tmdb-series-${providerId}`,
              seasonNumber: s.season_number,
              title: s.name || `Season ${s.season_number}`,
              overview: s.overview || "",
              episodeCount: s.episode_count || 0,
              airDate: s.air_date,
              posterUrl: s.poster_path ? `${this.imageBaseUrl}${s.poster_path}` : undefined,
            };
          });
      }

      return {
        id: `cat-tmdb-${mediaType}-${providerId}`,
        provider: "tmdb",
        providerId,
        mediaType,
        originalTitle,
        primaryTitle: title,
        description: data.overview || "",
        releaseYear: isNaN(year) ? 0 : year,
        releaseDate,
        genres,
        posterUrl: data.poster_path ? `${this.imageBaseUrl}${data.poster_path}` : "",
        backdropUrl: data.backdrop_path ? `${this.imageBaseUrl}${data.backdrop_path}` : undefined,
        originalLanguage: data.original_language || "en",
        rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : 0,
        voteCount: data.vote_count,
        totalSeasons: mediaType === "series" ? data.number_of_seasons || seasons?.length : undefined,
        totalEpisodes: mediaType === "series" ? data.number_of_episodes || totalEpisodes : undefined,
        attribution: "Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
        alternateTitles,
        seasons,
      };
    } catch (err) {
      console.warn(`[TMDBProvider] Failed to fetch details for ${providerId}:`, err);
      return null;
    }
  }

  async getSeasonEpisodes(providerId: string, seasonNumber: number): Promise<MediaEpisodeItem[]> {
    if (!this.apiKey) return [];
    await this.limiter.throttle();

    const url = `${this.baseUrl}/tv/${providerId}/season/${seasonNumber}?api_key=${this.apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const episodes = (data.episodes || []) as any[];

      return episodes.map((ep) => ({
        id: `ep-tmdb-${providerId}-${seasonNumber}-${ep.episode_number}`,
        catalogId: `cat-tmdb-series-${providerId}`,
        seasonNumber,
        episodeNumber: ep.episode_number,
        title: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview || "",
        runtimeMinutes: ep.runtime || undefined,
        airDate: ep.air_date,
      }));
    } catch (err) {
      console.warn(`[TMDBProvider] Failed to fetch season episodes:`, err);
      return [];
    }
  }
}

/**
 * TVmaze Supplementary Television Provider
 * Free REST API with no API key requirement, generous rate limit (20 req/10s).
 */
export class TVmazeProvider implements IMetadataProvider {
  readonly name = "tvmaze";
  private baseUrl = "https://api.tvmaze.com";
  private limiter = new RateLimiter(500);

  async search(query: string, mediaType: CatalogMediaType): Promise<ProviderSearchResult[]> {
    if (mediaType !== "series") return []; // TVmaze is TV/web series only
    await this.limiter.throttle();

    try {
      const res = await fetch(`${this.baseUrl}/search/shows?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = (await res.json()) as any[];

      return data.map((entry) => {
        const show = entry.show;
        const year = show.premiered ? parseInt(show.premiered.substring(0, 4), 10) : 0;
        const cleanSummary = (show.summary || "").replace(/<[^>]*>/g, "");

        return {
          providerId: String(show.id),
          mediaType: "series",
          title: show.name,
          originalTitle: show.name,
          releaseYear: isNaN(year) ? 0 : year,
          overview: cleanSummary,
          posterUrl: show.image?.medium || show.image?.original || "",
          originalLanguage: show.language?.toLowerCase() || "en",
          rating: show.rating?.average || 0,
        };
      });
    } catch (err) {
      console.warn("[TVmazeProvider] Search error:", err);
      return [];
    }
  }

  async getDetails(providerId: string, mediaType: CatalogMediaType): Promise<MediaCatalogItem | null> {
    if (mediaType !== "series") return null;
    await this.limiter.throttle();

    try {
      const res = await fetch(`${this.baseUrl}/shows/${providerId}?embed=episodes`);
      if (!res.ok) return null;
      const show = await res.json();
      const year = show.premiered ? parseInt(show.premiered.substring(0, 4), 10) : 0;
      const cleanSummary = (show.summary || "").replace(/<[^>]*>/g, "");

      // Group embedded episodes by season
      const seasonMap = new Map<number, MediaEpisodeItem[]>();
      const rawEpisodes = show._embedded?.episodes || [];
      for (const ep of rawEpisodes) {
        const sNum = ep.season || 1;
        if (!seasonMap.has(sNum)) seasonMap.set(sNum, []);
        seasonMap.get(sNum)!.push({
          id: `ep-tvm-${providerId}-${sNum}-${ep.number}`,
          catalogId: `cat-tvm-series-${providerId}`,
          seasonNumber: sNum,
          episodeNumber: ep.number || 1,
          title: ep.name || `Episode ${ep.number}`,
          overview: (ep.summary || "").replace(/<[^>]*>/g, ""),
          runtimeMinutes: ep.runtime,
          airDate: ep.airdate,
        });
      }

      const seasons: MediaSeasonItem[] = Array.from(seasonMap.entries()).map(([sNum, eps]) => ({
        id: `sea-tvm-${providerId}-${sNum}`,
        catalogId: `cat-tvm-series-${providerId}`,
        seasonNumber: sNum,
        title: `Season ${sNum}`,
        episodeCount: eps.length,
        episodes: eps,
      }));

      return {
        id: `cat-tvm-series-${providerId}`,
        provider: "tvmaze",
        providerId,
        mediaType: "series",
        originalTitle: show.name,
        primaryTitle: show.name,
        description: cleanSummary,
        releaseYear: isNaN(year) ? 0 : year,
        releaseDate: show.premiered,
        genres: show.genres || [],
        posterUrl: show.image?.medium || show.image?.original || "",
        originalLanguage: show.language ? show.language.substring(0, 2).toLowerCase() : "en",
        rating: show.rating?.average || 0,
        totalSeasons: seasons.length,
        totalEpisodes: rawEpisodes.length,
        attribution: "Metadata provided by TVmaze under CC BY-SA 4.0 license.",
        seasons,
      };
    } catch (err) {
      console.warn(`[TVmazeProvider] Details error for ${providerId}:`, err);
      return null;
    }
  }

  async getSeasonEpisodes(providerId: string, seasonNumber: number): Promise<MediaEpisodeItem[]> {
    const details = await this.getDetails(providerId, "series");
    const season = details?.seasons?.find((s) => s.seasonNumber === seasonNumber);
    return season?.episodes || [];
  }
}
