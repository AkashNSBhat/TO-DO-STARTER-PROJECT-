import React from "react";
import { Search, X, Globe } from "lucide-react";
import { CatalogFilterOptions } from "../../lib/catalog/types";

interface DiscoverFiltersProps {
  filters: CatalogFilterOptions;
  onChange: (updated: CatalogFilterOptions) => void;
  availableGenres: string[];
}

const LANGUAGES = [
  { code: "all", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "ko", label: "Korean (한국어)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "th", label: "Thai (ไทย)" },
  { code: "es", label: "Spanish" },
];

const DECADES = [
  { value: "all", label: "All Years" },
  { value: "2020s", label: "2020s (Recent)" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "classics", label: "Classics (<2000)" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated (Highest First)" },
  { value: "year_desc", label: "Release Year (Newest First)" },
  { value: "year_asc", label: "Release Year (Oldest First)" },
  { value: "title_asc", label: "Title (A to Z)" },
];

export const DiscoverFilters: React.FC<DiscoverFiltersProps> = ({
  filters,
  onChange,
  availableGenres,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleClearSearch = () => {
    onChange({ ...filters, searchQuery: "" });
  };

  const handleLanguageSelect = (code: string) => {
    onChange({ ...filters, language: code === "all" ? undefined : code });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    Boolean(filters.language && filters.language !== "all") ||
    Boolean(filters.genre && filters.genre !== "all") ||
    Boolean(filters.releaseYearDecade && filters.releaseYearDecade !== "all");

  const handleResetFilters = () => {
    onChange({
      mediaType: filters.mediaType,
      searchQuery: "",
      language: undefined,
      genre: undefined,
      releaseYearDecade: undefined,
      sortBy: "rating",
    });
  };

  return (
    <div className="flex flex-col gap-3.5 mb-6 bg-charcoal-900/40 p-4 rounded-xl border border-charcoal-800">
      {/* Search Bar & Reset Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, alternate title (e.g., Kantara, ಕಾಂತಾರ, Dark, 3 Idiots)..."
            value={filters.searchQuery || ""}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2 rounded-lg bg-charcoal-950 border border-charcoal-700/80 text-charcoal-100 placeholder-charcoal-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
          {filters.searchQuery ? (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-charcoal-400 hover:text-charcoal-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Dropdowns Row: Genre, Decade, Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Genre Dropdown */}
          <select
            value={filters.genre || "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                genre: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="px-2.5 py-2 rounded-lg bg-charcoal-950 border border-charcoal-700 text-charcoal-200 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Genres</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Decade Dropdown */}
          <select
            value={filters.releaseYearDecade || "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                releaseYearDecade:
                  e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className="px-2.5 py-2 rounded-lg bg-charcoal-950 border border-charcoal-700 text-charcoal-200 text-xs focus:outline-none focus:border-teal-500"
          >
            {DECADES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={filters.sortBy || "rating"}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as CatalogFilterOptions["sortBy"],
              })
            }
            className="px-2.5 py-2 rounded-lg bg-charcoal-950 border border-charcoal-700 text-charcoal-200 text-xs focus:outline-none focus:border-teal-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs text-charcoal-300 transition-colors"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Language Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
        <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <Globe className="w-3 h-3 text-teal-400" /> Language:
        </span>
        {LANGUAGES.map((lang) => {
          const isSelected =
            (lang.code === "all" && !filters.language) ||
            filters.language === lang.code;

          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-teal-500 text-charcoal-950 font-semibold shadow-sm shadow-teal-500/20"
                  : "bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700 hover:text-charcoal-100"
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
