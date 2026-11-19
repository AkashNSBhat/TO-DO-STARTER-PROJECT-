export type CatalogMediaType = "movie" | "series";

export interface MediaCatalogItem {
  id: string;
  provider: "tmdb" | "tvmaze" | "local_pack";
  providerId: string;
  mediaType: CatalogMediaType;
  originalTitle: string;
  primaryTitle: string;
  description: string;
  releaseYear: number;
  releaseDate?: string;
  genres: string[];
  posterUrl: string;
  backdropUrl?: string;
  originalLanguage: string; // ISO 639-1: 'en', 'hi', 'kn', 'de', etc.
  rating: number; // 0.0 - 10.0
  voteCount?: number;
  totalSeasons?: number; // for series
  totalEpisodes?: number; // for series
  attribution: string;
  alternateTitles?: MediaTitleItem[];
  languages?: MediaLanguageItem[];
  seasons?: MediaSeasonItem[];
}

export interface MediaTitleItem {
  id: string;
  catalogId: string;
  title: string;
  language: string; // 'en', 'hi', 'kn', 'de', etc.
  type: "localized" | "transliterated" | "alias" | "original";
}

export interface MediaLanguageItem {
  id: string;
  catalogId: string;
  languageCode: string; // 'en', 'hi', 'kn', 'de', etc.
  languageName: string; // 'English', 'Hindi', 'Kannada', 'German'
  isOriginal: boolean;
  isDubbed: boolean; // Verified audio track
  hasSubtitles: boolean;
}

export interface MediaSeasonItem {
  id: string;
  catalogId: string;
  seasonNumber: number;
  title: string;
  overview?: string;
  episodeCount: number;
  airDate?: string;
  posterUrl?: string;
  episodes?: MediaEpisodeItem[];
}

export interface MediaEpisodeItem {
  id: string;
  seasonId?: string;
  catalogId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  runtimeMinutes?: number;
  airDate?: string;
}

export interface CatalogMetadata {
  catalogVersion: string;
  schemaVersion: number;
  totalMovies: number;
  totalSeries: number;
  supportedLanguages: string[];
  lastUpdated: string;
  provider: string;
  attributionNotice: string;
}

export interface CatalogFilterOptions {
  mediaType?: CatalogMediaType;
  searchQuery?: string;
  language?: string; // 'all' | 'en' | 'hi' | 'kn' | 'de' | ...
  genre?: string;
  releaseYearDecade?: string; // 'all' | '2020s' | '2010s' | '2000s' | 'classics'
  sortBy?: "rating" | "year_desc" | "year_asc" | "title_asc";
}

export interface ProviderSearchResult {
  providerId: string;
  mediaType: CatalogMediaType;
  title: string;
  originalTitle: string;
  releaseYear: number;
  overview: string;
  posterUrl: string;
  originalLanguage: string;
  rating: number;
}
