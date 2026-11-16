import React, { useState, useMemo } from "react";
import {
  Archive,
  Film,
  Tv,
  Star,
  Calendar,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useArchive } from "../hooks";
import { ArchiveItem, ArchiveFilter } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { cn } from "../lib/utils";

export const ArchivePage: React.FC = () => {
  const {
    items,
    filter,
    setFilter,
    genreFilter,
    setGenreFilter,
    yearFilter,
    setYearFilter,
    availableGenres,
    availableYears,
    loading,
  } = useArchive("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "rating" | "year">("date");
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);

  // Historical entry form state
  const [histTitle, setHistTitle] = useState("");
  const [histType, setHistType] = useState<"movie" | "series">("movie");
  const [histYear, setHistYear] = useState<string>("2023");
  const [histRating, setHistRating] = useState<string>("9.0");
  const [histDate, setHistDate] = useState<string>("2023-08-15");
  const [histGenres, setHistGenres] = useState<string[]>(["Sci-Fi"]);

  // Computed summary metrics
  const summary = useMemo(() => {
    const total = items.length;
    const moviesCount = items.filter((i) => i.type === "movie").length;
    const seriesCount = items.filter((i) => i.type === "series").length;
    const ratedItems = items.filter((i) => i.rating !== undefined);
    const avgRating =
      ratedItems.length > 0
        ? (
            ratedItems.reduce((acc, curr) => acc + (curr.rating ?? 0), 0) /
            ratedItems.length
          ).toFixed(1)
        : "—";

    return { total, moviesCount, seriesCount, avgRating };
  }, [items]);

  // Filter and sort items
  const displayedItems = useMemo(() => {
    let list = items.filter((item) => {
      // Type filter
      if (filter === "movies" || filter === "movie") {
        if (item.type !== "movie") return false;
      } else if (filter === "series") {
        if (item.type !== "series") return false;
      }

      // Genre filter
      if (genreFilter !== "all" && !item.genres.includes(genreFilter)) {
        return false;
      }

      // Year filter
      if (yearFilter !== "all" && String(item.releaseYear) !== yearFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchGenre = item.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchTitle && !matchGenre) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === "year") {
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      }
      // Default: date completed descending
      return b.dateCompleted.localeCompare(a.dateCompleted);
    });
  }, [items, filter, genreFilter, yearFilter, searchQuery, sortBy]);

  const handleCreateHistoricalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!histTitle.trim()) return;

    const newItem: ArchiveItem = {
      id: `arch-${Date.now()}`,
      type: histType,
      title: histTitle.trim(),
      releaseYear: parseInt(histYear, 10) || undefined,
      rating: parseFloat(histRating) || undefined,
      genres: histGenres,
      dateCompleted: histDate || new Date().toISOString().slice(0, 10),
      isHistorical: true,
    };

    items.unshift(newItem);
    setIsHistoricalModalOpen(false);
    setHistTitle("");
  };

  const toggleGenre = (g: string) => {
    setHistGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Archive className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Entertainment Archive
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permanent personal ledger of completed movies and finished series. Records are never deleted automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsHistoricalModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Historical Entry
          </Button>
        </div>
      </div>

      {/* Permanent Retention Guarantee Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
        <ShieldCheck className="w-5 h-5 shrink-0 text-teal-400" />
        <div className="flex-1">
          <span className="font-bold">Permanent Preservation: </span>
          <span>
            Every title marked completed stays in this archive permanently with exact rating, genre attributes, and completion timestamps.
          </span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Total Completed Titles
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {summary.total}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Movies Finished
          </span>
          <span className="text-xl font-bold text-teal-400 font-mono">
            {summary.moviesCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Series Finished
          </span>
          <span className="text-xl font-bold text-violet-400 font-mono">
            {summary.seriesCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Average Personal Rating
          </span>
          <div className="flex items-center gap-1.5 text-xl font-bold text-amber-400 font-mono">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{summary.avgRating}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-charcoal-700 pb-3">
        {/* Type pills: All, Movies, Series */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          {(["all", "movies", "series"] as ArchiveFilter[]).map((tab) => {
            const isActive = filter === tab;
            const label =
              tab === "all" ? "All Media" : tab === "movies" ? "Movies" : "TV Series";
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-charcoal-700 text-teal-600 dark:text-teal-400 font-bold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Genre, Year, Sort */}
        <div className="flex items-center gap-2">
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Genres</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Release Years</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "rating" | "year")}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="date">Completed Date (Newest)</option>
            <option value="rating">Rating (Highest)</option>
            <option value="year">Release Year (Newest)</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search archive by title or genre..."
          icon={Search}
          clearable
          inputSize="sm"
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-charcoal-800/50 border border-charcoal-700/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedItems.length === 0 && (
        <Card className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
            <Archive className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            No archived items found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
            {searchQuery
              ? `No titles match "${searchQuery}".`
              : "Completed movies and series automatically appear here. You can also import historical watch records."}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsHistoricalModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Past Completion
          </Button>
        </Card>
      )}

      {/* Archive Items Grid/List */}
      {!loading && displayedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 hover:border-teal-500/40 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0",
                    item.type === "movie"
                      ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  )}
                >
                  {item.type === "movie" ? (
                    <Film className="w-5 h-5" />
                  ) : (
                    <Tv className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    {item.releaseYear && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ({item.releaseYear})
                      </span>
                    )}
                    {item.isHistorical && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-charcoal-700 text-slate-400 border border-charcoal-600 font-medium">
                        Historical
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400">
                      {item.type}
                    </span>
                    {item.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] text-slate-500 dark:text-slate-400"
                      >
                        • {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating and Completion Date */}
              <div className="text-right shrink-0 space-y-1">
                {item.rating !== undefined ? (
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      /10
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Unrated</span>
                )}
                <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-slate-400">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{item.dateCompleted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Historical Entry Modal */}
      <Modal
        isOpen={isHistoricalModalOpen}
        onClose={() => setIsHistoricalModalOpen(false)}
        title="Add Historical Completion"
        description="Record a movie or series you previously finished so your lifetime completion record is complete."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoricalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateHistoricalSubmit}
              disabled={!histTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save to Archive
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateHistoricalSubmit} className="space-y-4">
          <Input
            label="Title *"
            value={histTitle}
            onChange={setHistTitle}
            placeholder="e.g. Interstellar"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Media Type
              </label>
              <select
                value={histType}
                onChange={(e) => setHistType(e.target.value as "movie" | "series")}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="movie">Movie</option>
                <option value="series">TV Series</option>
              </select>
            </div>
            <Input
              label="Release Year"
              value={histYear}
              onChange={setHistYear}
              placeholder="e.g. 2014"
              type="number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Approx. Completion Date"
              value={histDate}
              onChange={setHistDate}
              type="date"
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Personal Rating (/10)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={histRating}
                  onChange={(e) => setHistRating(e.target.value)}
                  className="flex-1 accent-teal-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-amber-400 w-8 text-right">
                  {parseFloat(histRating).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["Sci-Fi", "Drama", "Action", "Thriller", "Crime", "Comedy"].map(
                (g) => {
                  const isSelected = histGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        isSelected
                          ? "bg-teal-500 text-charcoal-950 font-bold"
                          : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      {g}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
