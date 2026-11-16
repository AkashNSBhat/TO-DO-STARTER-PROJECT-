import React, { useState, useMemo } from "react";
import {
  Tv,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Star,
  ChevronRight,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { useSeries } from "../hooks";
import { SeriesDetail, SeriesStatus } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { ProgressBar } from "../components/common/ProgressBar";
import { cn } from "../lib/utils";

export const SeriesPage: React.FC = () => {
  const {
    series,
    selectedSeries,
    selectSeries,
    toggleEpisode,
    loading,
  } = useSeries();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Series Form state
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<SeriesStatus>("watching");
  const [newSeasonsCount, setNewSeasonsCount] = useState("3");
  const [newEpisodesPerSeason, setNewEpisodesPerSeason] = useState("10");
  const [newGenres, setNewGenres] = useState<string[]>(["Drama", "Sci-Fi"]);

  // Filter series by search query
  const filteredSeries = useMemo(() => {
    if (!searchQuery.trim()) return series;
    const q = searchQuery.toLowerCase();
    return series.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.genres.some((g) => g.toLowerCase().includes(q))
    );
  }, [series, searchQuery]);

  // Handle series selection and default season
  const handleSelectSeries = (s: SeriesDetail) => {
    selectSeries(s.id);
    setSelectedSeasonNumber(1);
  };

  const handleBackToSeriesList = () => {
    selectSeries(null);
  };

  const activeSeason = useMemo(() => {
    if (!selectedSeries || !selectedSeries.seasons) return null;
    return (
      selectedSeries.seasons.find(
        (s) => s.seasonNumber === selectedSeasonNumber
      ) || selectedSeries.seasons[0] || null
    );
  }, [selectedSeries, selectedSeasonNumber]);

  const activeSeasonProgress = useMemo(() => {
    if (!activeSeason || activeSeason.episodes.length === 0) return 0;
    const completed = activeSeason.episodes.filter((e) => e.isCompleted).length;
    return Math.round((completed / activeSeason.episodes.length) * 100);
  }, [activeSeason]);

  const handleCreateSeriesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const seasonsCount = parseInt(newSeasonsCount, 10) || 1;
    const epsCount = parseInt(newEpisodesPerSeason, 10) || 10;

    const created: SeriesDetail = {
      id: `ser-${Date.now()}`,
      title: newTitle.trim(),
      status: newStatus,
      totalSeasons: seasonsCount,
      totalEpisodes: seasonsCount * epsCount,
      completedEpisodes: 0,
      progressText: `0/${seasonsCount * epsCount} Episodes`,
      genres: newGenres,
      rating: 8.5,
    };

    series.unshift(created);
    setIsAddModalOpen(false);
    setNewTitle("");
  };

  const toggleGenre = (genre: string) => {
    setNewGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Tv className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Series & Episode Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hierarchical tracking across seasons and individual episodes. Watched status and timestamps are permanently preserved.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Series
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedSeries ? (
        /* ========================================================
           DETAIL VIEW: Selected Series Hierarchical Season/Episodes
           ======================================================== */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToSeriesList}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Back to All Series
            </Button>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedSeries.title}
            </span>
          </div>

          {/* Series Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedSeries.status === "completed"
                        ? "success"
                        : selectedSeries.status === "watching"
                        ? "teal"
                        : "amber"
                    }
                  >
                    {selectedSeries.status}
                  </Badge>
                  {selectedSeries.rating && (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{selectedSeries.rating.toFixed(1)} / 10</span>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-extrabold text-slate-100">
                  {selectedSeries.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    {selectedSeries.totalSeasons} Seasons
                  </span>
                  <span>•</span>
                  <span>{selectedSeries.totalEpisodes} Total Episodes</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {selectedSeries.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-700 text-slate-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Progress Gauge */}
              <div className="w-full md:w-64 p-4 rounded-xl bg-charcoal-950/60 border border-charcoal-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Series Progress</span>
                  <span className="font-mono font-bold text-teal-400">
                    {selectedSeries.progressText}
                  </span>
                </div>
                <ProgressBar
                  value={selectedSeries.completedEpisodes}
                  max={selectedSeries.totalEpisodes || 1}
                  variant="teal"
                  size="md"
                />
                <p className="text-[10px] text-slate-500 text-right">
                  {Math.round(
                    (selectedSeries.completedEpisodes /
                      (selectedSeries.totalEpisodes || 1)) *
                      100
                  )}
                  % Cumulative Completion
                </p>
              </div>
            </div>
          </div>

          {/* Season Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-charcoal-700">
            {selectedSeries.seasons.map((season) => {
              const isSeasonActive =
                season.seasonNumber === selectedSeasonNumber;
              const seasonCompletedCount = season.episodes.filter(
                (e) => e.isCompleted
              ).length;
              return (
                <button
                  key={season.id}
                  onClick={() => setSelectedSeasonNumber(season.seasonNumber)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    isSeasonActive
                      ? "bg-teal-500 text-charcoal-950 font-bold shadow-md"
                      : "bg-charcoal-800 text-slate-300 hover:bg-charcoal-700 hover:text-white border border-charcoal-700"
                  )}
                >
                  <span>Season {season.seasonNumber}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                      isSeasonActive
                        ? "bg-charcoal-950/20 text-charcoal-950 font-bold"
                        : "bg-charcoal-900 text-slate-400"
                    )}
                  >
                    {seasonCompletedCount}/{season.episodes.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Season Episodes List */}
          {activeSeason && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {activeSeason.title || `Season ${activeSeason.seasonNumber}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSeason.episodes.length} episodes • {activeSeasonProgress}% watched
                  </p>
                </div>
                <div className="w-48 hidden sm:block">
                  <ProgressBar
                    value={activeSeasonProgress}
                    max={100}
                    variant="emerald"
                    size="sm"
                    showPercent
                  />
                </div>
              </div>

              {/* Episode Items */}
              <div className="rounded-xl border border-charcoal-700 divide-y divide-charcoal-700/60 bg-charcoal-800/80 overflow-hidden">
                {activeSeason.episodes.map((ep) => {
                  const sPrefix = String(activeSeason.seasonNumber).padStart(2, "0");
                  const ePrefix = String(ep.episodeNumber).padStart(2, "0");
                  const epCode = `S${sPrefix}E${ePrefix}`;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => toggleEpisode(ep.id, !ep.isCompleted)}
                      className={cn(
                        "flex items-center justify-between p-3.5 transition-colors cursor-pointer select-none",
                        ep.isCompleted
                          ? "bg-charcoal-850/50 hover:bg-charcoal-850/80"
                          : "hover:bg-charcoal-750"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                            ep.isCompleted
                              ? "text-emerald-400"
                              : "text-slate-500 hover:text-teal-400"
                          )}
                        >
                          {ep.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 stroke-[1.5]" />
                          )}
                        </button>

                        <span className="font-mono text-xs font-bold text-teal-400/90 w-16">
                          {epCode}
                        </span>

                        <div>
                          <p
                            className={cn(
                              "text-xs font-medium transition-colors",
                              ep.isCompleted
                                ? "line-through text-slate-500 font-normal"
                                : "text-slate-100"
                            )}
                          >
                            {ep.title}
                          </p>
                          {ep.notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              {ep.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ep.isCompleted && ep.completedAt && (
                          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                            Watched: {ep.completedAt.slice(0, 10)}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold",
                            ep.isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-charcoal-700 text-slate-400"
                          )}
                        >
                          {ep.isCompleted ? "Watched" : "Unwatched"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           OVERVIEW: Series Cards Catalog Grid
           ======================================================== */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="max-w-md">
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search series by title or genre..."
              icon={Search}
              clearable
              inputSize="sm"
            />
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl bg-charcoal-800/50 border border-charcoal-700/60 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && filteredSeries.length === 0 && (
            <Card className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
                <Tv className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                No television series found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
                Start tracking long-form TV series with season-by-season episode checklists.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Series
              </Button>
            </Card>
          )}

          {!loading && filteredSeries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSeries.map((s) => {
                const progressPct = Math.round(
                  (s.completedEpisodes / (s.totalEpisodes || 1)) * 100
                );

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSeries(s)}
                    className="group flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-charcoal-800/90 border border-slate-200 dark:border-charcoal-700 hover:border-teal-500/40 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform">
                            <Tv className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-400 transition-colors">
                              {s.title}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {s.totalSeasons} Seasons • {s.totalEpisodes} Episodes
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={
                            s.status === "completed"
                              ? "success"
                              : s.status === "watching"
                              ? "teal"
                              : "amber"
                          }
                        >
                          {s.status}
                        </Badge>
                      </div>

                      {/* Genre pills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {s.genres.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-charcoal-700/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {s.progressText}
                        </span>
                        <span className="font-mono font-bold text-teal-400">
                          {progressPct}%
                        </span>
                      </div>
                      <ProgressBar
                        value={s.completedEpisodes}
                        max={s.totalEpisodes || 1}
                        variant={s.status === "completed" ? "emerald" : "teal"}
                        size="sm"
                      />
                      <div className="flex items-center justify-end pt-1">
                        <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Track Episodes <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Series Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Television Series"
        description="Configure total seasons and episode structures. Individual episode checklists are generated automatically."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSeriesSubmit}
              disabled={!newTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Generate Series
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSeriesSubmit} className="space-y-4">
          <Input
            label="Series Title *"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="e.g. Severance"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Seasons"
              value={newSeasonsCount}
              onChange={setNewSeasonsCount}
              type="number"
              placeholder="e.g. 2"
            />
            <Input
              label="Episodes Per Season"
              value={newEpisodesPerSeason}
              onChange={setNewEpisodesPerSeason}
              type="number"
              placeholder="e.g. 9"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as SeriesStatus)}
              className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="watching">Currently Watching</option>
              <option value="planned">Plan to Watch</option>
              <option value="completed">Completed Series</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["Sci-Fi", "Drama", "Mystery", "Thriller", "Crime", "Comedy"].map(
                (g) => {
                  const isSelected = newGenres.includes(g);
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
