import React, { useState, useEffect, useMemo } from "react";
import {
  Film,
  Tv,
  Compass,
  Sparkles,
  WifiOff,
  Database,
  CheckCircle2,
} from "lucide-react";
import {
  MediaCatalogItem,
  CatalogMediaType,
  CatalogFilterOptions,
  CatalogMetadata,
} from "../lib/catalog/types";
import { CatalogueClient } from "../lib/catalog/client";
import { DiscoverCard } from "../components/discover/DiscoverCard";
import { DiscoverFilters } from "../components/discover/DiscoverFilters";
import { DiscoverDetailModal } from "../components/discover/DiscoverDetailModal";
import { CatalogueManagerModal } from "../components/discover/CatalogueManagerModal";

export const DiscoverPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogMediaType>("movie");
  const [items, setItems] = useState<MediaCatalogItem[]>([]);
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<MediaCatalogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<CatalogFilterOptions>({
    mediaType: "movie",
    searchQuery: "",
    language: undefined,
    genre: undefined,
    releaseYearDecade: undefined,
    sortBy: "rating",
  });

  // Load catalog metadata on mount
  useEffect(() => {
    CatalogueClient.getCatalogMetadata().then((data) => setMetadata(data));
  }, []);

  // Fetch catalog items when filters or active tab changes
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const activeFilters: CatalogFilterOptions = {
      ...filters,
      mediaType: activeTab,
    };

    CatalogueClient.getCatalogItems(activeFilters)
      .then((results) => {
        if (mounted) {
          setItems(results);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[DiscoverPage] Failed to fetch catalog items:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, filters]);

  // Compute available distinct genres for the active media type
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    items.forEach((item) => {
      item.genres.forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [items]);

  const handleTabChange = (tab: CatalogMediaType) => {
    setActiveTab(tab);
    setFilters((prev) => ({
      ...prev,
      mediaType: tab,
    }));
  };

  const handleWatchlistUpdated = (title?: string) => {
    setToastMessage(
      title ? `Added "${title}" to your personal Watchlist!` : "Watchlist updated!"
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-500 text-charcoal-950 font-medium text-xs shadow-xl animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-charcoal-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-charcoal-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-charcoal-50 flex items-center gap-2">
                <span>Discover Catalogue</span>
                {CatalogueClient.hasTmdbApiKey() ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    TMDB Live Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <Sparkles className="w-3 h-3" />
                    Offline Ready
                  </span>
                )}
              </h1>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Explore curated movies & series in English, Hindi, Kannada, German and more.
              </p>
            </div>
          </div>
        </div>

        {/* Catalogue Info Badges & Manager Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {metadata && (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-xs text-charcoal-400">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  <strong className="text-charcoal-200">{metadata.totalMovies}</strong> Movies •{" "}
                  <strong className="text-charcoal-200">{metadata.totalSeries}</strong> Series
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-[11px] text-charcoal-400">
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Offline SQLite</span>
              </span>
            </>
          )}

          <button
            onClick={() => setIsManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Catalogue Manager</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs: Movies vs Series */}
      <div className="flex items-center gap-3">
        <div className="inline-flex p-1 rounded-xl bg-charcoal-900 border border-charcoal-800">
          <button
            onClick={() => handleTabChange("movie")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "movie"
                ? "bg-teal-500 text-charcoal-950 shadow-md shadow-teal-500/20"
                : "text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800/60"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Movies</span>
            {metadata && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "movie"
                    ? "bg-charcoal-950/20 text-charcoal-950 font-bold"
                    : "bg-charcoal-800 text-charcoal-400"
                }`}
              >
                {metadata.totalMovies}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("series")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "series"
                ? "bg-teal-500 text-charcoal-950 shadow-md shadow-teal-500/20"
                : "text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800/60"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Series & Shows</span>
            {metadata && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "series"
                    ? "bg-charcoal-950/20 text-charcoal-950 font-bold"
                    : "bg-charcoal-800 text-charcoal-400"
                }`}
              >
                {metadata.totalSeries}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <DiscoverFilters
        filters={filters}
        onChange={setFilters}
        availableGenres={availableGenres}
      />

      {/* Main Results View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center text-charcoal-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading catalogue records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-charcoal-900/40 border border-charcoal-800/80">
          <Compass className="w-12 h-12 text-charcoal-600 mb-3" />
          <h3 className="text-sm font-semibold text-charcoal-200">
            No matching titles found
          </h3>
          <p className="text-xs text-charcoal-400 mt-1 max-w-sm">
            Try adjusting your search query, clearing language filters, or selecting a different decade.
          </p>
        </div>
      ) : (
        <div>
          {/* Results Count Banner */}
          <div className="flex items-center justify-between pb-3 text-xs text-charcoal-400">
            <span>
              Showing <strong className="text-charcoal-200">{items.length}</strong>{" "}
              {activeTab === "movie" ? "movies" : "series"}
            </span>
            <span className="text-[11px] text-charcoal-500">
              Click any card to inspect episodes, languages, and details
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <DiscoverCard
                key={item.id}
                item={item}
                onSelect={(selected) => setSelectedItem(selected)}
                onWatchlistChanged={() => handleWatchlistUpdated(item.primaryTitle)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DiscoverDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddedToWatchlist={() => handleWatchlistUpdated(selectedItem.primaryTitle)}
        />
      )}

      {/* Catalogue Manager Modal */}
      <CatalogueManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onCatalogueUpdated={() => {
          CatalogueClient.getCatalogMetadata().then((m) => setMetadata(m));
          CatalogueClient.getCatalogItems({ mediaType: activeTab, ...filters }).then((res) =>
            setItems(res)
          );
        }}
      />
    </div>
  );
};
