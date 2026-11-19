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
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";
import { useSeries, SeriesFilter } from "../hooks";
import {
  SeriesDetail,
  SeriesStatus,
  CreateSeriesInput,
  UpdateSeriesInput,
  SeasonConfigInput,
} from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { ProgressBar } from "../components/common/ProgressBar";
import { cn } from "../lib/utils";

const PRESET_GENRES = [
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Mystery",
  "Crime",
  "Comedy",
  "Action",
  "Adventure",
  "Animation",
  "Fantasy",
  "Documentary",
];

export const SeriesPage: React.FC = () => {
  const {
    series,
    filteredSeries,
    selectedSeries,
    selectSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    updateEpisodeTitle,
    toggleEpisode,
    rateSeries,
    addSeason,
    deleteSeason,
    addEpisode,
    deleteEpisode,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loading,
  } = useSeries();

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);

  // Add Series Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newReleaseYear, setNewReleaseYear] = useState(new Date().getFullYear().toString());
  const [newStatus, setNewStatus] = useState<SeriesStatus>("watching");
  const [newNotes, setNewNotes] = useState("");
  const [newPosterUrl, setNewPosterUrl] = useState("");
  const [newGenres, setNewGenres] = useState<string[]>(["Drama", "Sci-Fi"]);
  const [customGenre, setCustomGenre] = useState("");
  const [seasonConfigs, setSeasonConfigs] = useState<SeasonConfigInput[]>([
    { seasonNumber: 1, episodeCount: 10 },
  ]);

  // Edit Series Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<SeriesDetail | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editReleaseYear, setEditReleaseYear] = useState("");
  const [editStatus, setEditStatus] = useState<SeriesStatus>("watching");
  const [editRating, setEditRating] = useState<number>(8.0);
  const [editNotes, setEditNotes] = useState("");
  const [editPosterUrl, setEditPosterUrl] = useState("");
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [editCustomGenre, setEditCustomGenre] = useState("");

  // Delete Series Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<SeriesDetail | null>(null);

  // Edit Episode Name Modal State
  const [isEditEpModalOpen, setIsEditEpModalOpen] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingEpisodeTitle, setEditingEpisodeTitle] = useState("");

  // Add Season Modal State
  const [isAddSeasonModalOpen, setIsAddSeasonModalOpen] = useState(false);
  const [newSeasonEpCount, setNewSeasonEpCount] = useState("10");

  // Add Episode Modal State
  const [isAddEpModalOpen, setIsAddEpModalOpen] = useState(false);
  const [newEpTitle, setNewEpTitle] = useState("");

  // Series Completion Celebration & Rating Modal State
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completedSeriesId, setCompletedSeriesId] = useState<string | null>(null);
  const [completionRating, setCompletionRating] = useState(9.0);

  // Status Filter Counts
  const counts = useMemo(() => {
    return {
      all: series.length,
      watching: series.filter((s) => s.status === "watching").length,
      completed: series.filter((s) => s.status === "completed").length,
      planned: series.filter((s) => s.status === "planned").length,
    };
  }, [series]);

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

  // Total cumulative series progress
  const seriesCumulativeProgress = useMemo(() => {
    if (!selectedSeries || selectedSeries.totalEpisodes === 0) return 0;
    return Math.round(
      (selectedSeries.completedEpisodes / selectedSeries.totalEpisodes) * 100
    );
  }, [selectedSeries]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setNewTitle("");
    setNewReleaseYear(new Date().getFullYear().toString());
    setNewStatus("watching");
    setNewNotes("");
    setNewPosterUrl("");
    setNewGenres(["Drama", "Sci-Fi"]);
    setCustomGenre("");
    setSeasonConfigs([
      { seasonNumber: 1, episodeCount: 10 },
      { seasonNumber: 2, episodeCount: 10 },
    ]);
    setIsAddModalOpen(true);
  };

  // Add/Remove seasons in configuration builder
  const handleAddSeasonConfig = () => {
    setSeasonConfigs((prev) => [
      ...prev,
      { seasonNumber: prev.length + 1, episodeCount: 10 },
    ]);
  };

  const handleRemoveSeasonConfig = (idx: number) => {
    if (seasonConfigs.length <= 1) return;
    setSeasonConfigs((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.map((cfg, i) => ({ ...cfg, seasonNumber: i + 1 }));
    });
  };

  const handleUpdateSeasonEpCount = (idx: number, countStr: string) => {
    const val = parseInt(countStr, 10);
    const count = isNaN(val) || val < 1 ? 1 : val;
    setSeasonConfigs((prev) =>
      prev.map((cfg, i) => (i === idx ? { ...cfg, episodeCount: count } : cfg))
    );
  };

  const toggleGenre = (genre: string) => {
    setNewGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (trimmed) {
      if (!newGenres.includes(trimmed)) {
        setNewGenres((prev) => [...prev, trimmed]);
      }
      setCustomGenre("");
    }
  };

  const addGenreOptions = useMemo(() => {
    const set = new Set([...PRESET_GENRES, ...newGenres]);
    return Array.from(set);
  }, [newGenres]);

  const editGenreOptions = useMemo(() => {
    const set = new Set([...PRESET_GENRES, ...editGenres]);
    return Array.from(set);
  }, [editGenres]);

  // Submit Create Series
  const handleCreateSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const yearNum = newReleaseYear.trim() ? parseInt(newReleaseYear, 10) : undefined;
    const input: CreateSeriesInput = {
      title: newTitle.trim(),
      releaseYear: isNaN(yearNum as number) ? undefined : yearNum,
      status: newStatus,
      genres: newGenres,
      notes: newNotes.trim() || undefined,
      posterUrl: newPosterUrl.trim() || undefined,
      seasons: seasonConfigs,
    };

    const created = await createSeries(input);
    if (created) {
      setIsAddModalOpen(false);
      setSelectedSeasonNumber(1);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (s: SeriesDetail, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSeriesToEdit(s);
    setEditTitle(s.title);
    setEditReleaseYear(s.releaseYear ? s.releaseYear.toString() : "");
    setEditStatus(s.status);
    setEditRating(s.rating || 8.0);
    setEditNotes(s.notes || "");
    setEditPosterUrl(s.posterUrl || "");
    setEditGenres(s.genres || []);
    setEditCustomGenre("");
    setIsEditModalOpen(true);
  };

  const handleEditSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesToEdit || !editTitle.trim()) return;

    const yearNum = editReleaseYear.trim() ? parseInt(editReleaseYear, 10) : undefined;
    const input: UpdateSeriesInput = {
      id: seriesToEdit.id,
      title: editTitle.trim(),
      releaseYear: isNaN(yearNum as number) ? undefined : yearNum,
      status: editStatus,
      rating: editRating,
      notes: editNotes.trim() || undefined,
      posterUrl: editPosterUrl.trim() || undefined,
      genres: editGenres,
    };

    const ok = await updateSeries(input);
    if (ok) {
      setIsEditModalOpen(false);
      setSeriesToEdit(null);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (s: SeriesDetail, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSeriesToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!seriesToDelete) return;
    await deleteSeries(seriesToDelete.id);
    setIsDeleteModalOpen(false);
    setSeriesToDelete(null);
  };

  // Episode Toggle
  const handleToggleEpisode = async (episodeId: string, currentCompleted: boolean) => {
    const nextState = !currentCompleted;
    const result = await toggleEpisode(episodeId, nextState);
    if (result.seriesCompleted && selectedSeries) {
      // Trigger completion dialog and rating prompt!
      setCompletedSeriesId(selectedSeries.id);
      setCompletionRating(selectedSeries.rating || 9.0);
      setIsCompletionModalOpen(true);
    }
  };

  // Rename Episode
  const handleOpenEditEpisode = (episodeId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEpisodeId(episodeId);
    setEditingEpisodeTitle(currentTitle);
    setIsEditEpModalOpen(true);
  };

  const handleSaveEpisodeTitle = async () => {
    if (!editingEpisodeId || !editingEpisodeTitle.trim()) return;
    await updateEpisodeTitle(editingEpisodeId, editingEpisodeTitle.trim());
    setIsEditEpModalOpen(false);
    setEditingEpisodeId(null);
  };

  // Add Season to selected series
  const handleConfirmAddSeason = async () => {
    if (!selectedSeries) return;
    const count = parseInt(newSeasonEpCount, 10) || 10;
    const added = await addSeason(selectedSeries.id, count);
    if (added) {
      setSelectedSeasonNumber(added.seasonNumber);
      setIsAddSeasonModalOpen(false);
    }
  };

  // Delete Season
  const handleDeleteActiveSeason = async () => {
    if (!activeSeason || !selectedSeries) return;
    if (selectedSeries.seasons.length <= 1) {
      alert("A series must have at least one season.");
      return;
    }
    const confirm = window.confirm(
      `Are you sure you want to delete ${activeSeason.title}? All episodes in this season will be deleted.`
    );
    if (confirm) {
      await deleteSeason(activeSeason.id);
      setSelectedSeasonNumber(1);
    }
  };

  // Add Episode to active season
  const handleConfirmAddEpisode = async () => {
    if (!activeSeason) return;
    await addEpisode(activeSeason.id, newEpTitle.trim() || undefined);
    setNewEpTitle("");
    setIsAddEpModalOpen(false);
  };

  // Delete Episode
  const handleDeleteEpisode = async (episodeId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm(`Permanently remove episode "${title}"?`);
    if (confirm) {
      await deleteEpisode(episodeId);
    }
  };

  // Save Completion Rating
  const handleSaveCompletionRating = async () => {
    if (!completedSeriesId) return;
    await rateSeries(completedSeriesId, completionRating);
    setIsCompletionModalOpen(false);
    setCompletedSeriesId(null);
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
            onClick={handleOpenCreateModal}
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
          {/* Breadcrumb / Back button & Actions */}
          <div className="flex items-center justify-between gap-4">
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

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleOpenEditModal(selectedSeries, e)}
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Series
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => handleOpenDeleteModal(selectedSeries, e)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
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
                  {selectedSeries.releaseYear && (
                    <span className="text-xs text-slate-400 font-mono">
                      ({selectedSeries.releaseYear})
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-extrabold text-slate-100">
                  {selectedSeries.title}
                </h2>

                {selectedSeries.notes && (
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    {selectedSeries.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    {selectedSeries.totalSeasons} Seasons
                  </span>
                  <span>•</span>
                  <span>{selectedSeries.totalEpisodes} Total Episodes</span>
                  <span>•</span>
                  <div className="flex flex-wrap items-center gap-1">
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
                  variant={selectedSeries.status === "completed" ? "emerald" : "teal"}
                  size="md"
                />
                <p className="text-[10px] text-slate-500 text-right">
                  {seriesCumulativeProgress}% Cumulative Completion
                </p>
              </div>
            </div>
          </div>

          {/* Season Selector Tabs & Add Season Action */}
          <div className="flex items-center justify-between gap-4 border-b border-charcoal-700 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
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

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddSeasonModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Season
            </Button>
          </div>

          {/* Active Season Episodes List */}
          {activeSeason && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>{activeSeason.title || `Season ${activeSeason.seasonNumber}`}</span>
                    <button
                      onClick={handleDeleteActiveSeason}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors p-1"
                      title="Delete Season"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSeason.episodes.length} episodes • {activeSeasonProgress}% watched
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-40 hidden sm:block">
                    <ProgressBar
                      value={activeSeasonProgress}
                      max={100}
                      variant="emerald"
                      size="sm"
                      showPercent
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddEpModalOpen(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Episode
                  </Button>
                </div>
              </div>

              {/* Episode Items */}
              <div className="rounded-xl border border-charcoal-700 divide-y divide-charcoal-700/60 bg-charcoal-800/80 overflow-hidden shadow-md">
                {activeSeason.episodes.map((ep) => {
                  const sPrefix = String(activeSeason.seasonNumber).padStart(2, "0");
                  const ePrefix = String(ep.episodeNumber).padStart(2, "0");
                  const epCode = `S${sPrefix}E${ePrefix}`;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => handleToggleEpisode(ep.id, ep.isCompleted)}
                      className={cn(
                        "group flex items-center justify-between p-3.5 transition-colors cursor-pointer select-none",
                        ep.isCompleted
                          ? "bg-charcoal-850/50 hover:bg-charcoal-850/80 text-slate-500"
                          : "hover:bg-charcoal-750 text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                        <button
                          type="button"
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0",
                            ep.isCompleted
                              ? "text-emerald-400"
                              : "text-slate-500 group-hover:text-teal-400"
                          )}
                        >
                          {ep.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 stroke-[1.5]" />
                          )}
                        </button>

                        <span className="font-mono text-xs font-bold text-teal-400/90 w-16 shrink-0">
                          {epCode}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-xs font-medium transition-colors truncate",
                              ep.isCompleted
                                ? "line-through text-slate-500 font-normal"
                                : "text-slate-100"
                            )}
                          >
                            {ep.title}
                          </p>
                          {ep.notes && (
                            <p className="text-[11px] text-slate-500 italic truncate">
                              {ep.notes}
                            </p>
                          )}
                        </div>

                        {/* Inline Edit episode button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditEpisode(ep.id, ep.title, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-300 transition-opacity"
                          title="Rename Episode"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Episode button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEpisode(ep.id, ep.title, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                          title="Delete Episode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
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
           OVERVIEW: Series Cards Catalog Grid & Filter Bar
           ======================================================== */
        <div className="space-y-6">
          {/* Status Tabs Bar & Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-charcoal-700 pb-3">
            {/* Status Segmented Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800/80 border border-slate-200/80 dark:border-charcoal-700/80">
              {(["all", "watching", "completed", "planned"] as SeriesFilter[]).map(
                (tab) => {
                  const isActive = statusFilter === tab;
                  const count = counts[tab];
                  const label = tab.charAt(0).toUpperCase() + tab.slice(1);
                  return (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                        isActive
                          ? "bg-white dark:bg-charcoal-700 text-teal-600 dark:text-teal-400 shadow-sm font-semibold border border-slate-200/60 dark:border-charcoal-600"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                          isActive
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold"
                            : "bg-slate-200 dark:bg-charcoal-600 text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Search bar */}
            <div className="w-full sm:w-72">
              <Input
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search series by title or genre..."
                icon={Search}
                clearable
                inputSize="sm"
              />
            </div>
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
                onClick={handleOpenCreateModal}
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
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <Tv className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-400 transition-colors">
                              {s.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>{s.totalSeasons} Seasons</span>
                              <span>•</span>
                              <span>{s.totalEpisodes} Episodes</span>
                              {s.releaseYear && <span>• ({s.releaseYear})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {s.rating && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {s.rating.toFixed(1)}
                            </span>
                          )}
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
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(s, e)}
                            className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-charcoal-700 transition-colors"
                            title="Edit Series"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteModal(s, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-charcoal-700 transition-colors"
                            title="Delete Series"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

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

      {/* ========================================================
         ADD SERIES MODAL (With Per-Season Episode Count Config)
         ======================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Television Series"
        description="Configure metadata, total seasons, and episode counts per season. Individual episode lists are generated automatically."
        size="lg"
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
            placeholder="e.g. Severance, Breaking Bad"
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Release Year"
              value={newReleaseYear}
              onChange={setNewReleaseYear}
              type="number"
              placeholder="e.g. 2022"
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Status
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
          </div>

          <Input
            label="Synopsis / Notes (Optional)"
            value={newNotes}
            onChange={setNewNotes}
            placeholder="Premise, cast notes, or personal impressions..."
          />

          {/* Season-by-Season Episode Configuration */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-charcoal-700">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  Season & Episode Configuration
                </label>
                <p className="text-[11px] text-slate-500">
                  Configure episodes separately for each season.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSeasonConfig}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Season
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {seasonConfigs.map((cfg, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700"
                >
                  <span className="font-mono text-xs font-bold text-teal-400 w-20">
                    Season {cfg.seasonNumber}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Episodes:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={cfg.episodeCount}
                      onChange={(e) => handleUpdateSeasonEpCount(idx, e.target.value)}
                      className="w-20 px-2 py-1 text-xs rounded border border-slate-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  {seasonConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSeasonConfig(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove season"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Genres Tag Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-charcoal-700">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Genres & Tags
              </label>
              <span className="text-[11px] text-slate-400">
                {newGenres.length} selected
              </span>
            </div>

            {/* Selected Tags Row with Remove Buttons */}
            {newGenres.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-charcoal-750 border border-slate-200/80 dark:border-charcoal-600/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Active Tags:
                </span>
                {newGenres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-teal-500/15 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-medium"
                  >
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Genre Tiles: Presets + Custom Added Tiles */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto py-1">
              {addGenreOptions.map((g) => {
                const isSelected = newGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                      isSelected
                        ? "bg-teal-500 text-charcoal-950 font-bold shadow-xs scale-102"
                        : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    <span>{g}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Genre Input */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="text"
                placeholder="Type new custom tag (e.g. Anime, Mystery)..."
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomGenre();
                  }
                }}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomGenre}
                disabled={!customGenre.trim()}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Tag
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================
         EDIT SERIES MODAL
         ======================================================== */}
      {seriesToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Series: ${seriesToEdit.title}`}
          description="Update series metadata, release year, viewing status, and personal rating."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEditSeriesSubmit}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleEditSeriesSubmit} className="space-y-4">
            <Input
              label="Series Title *"
              value={editTitle}
              onChange={setEditTitle}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Release Year"
                value={editReleaseYear}
                onChange={setEditReleaseYear}
                type="number"
              />
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SeriesStatus)}
                  className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="watching">Currently Watching</option>
                  <option value="planned">Plan to Watch</option>
                  <option value="completed">Completed Series</option>
                </select>
              </div>
            </div>

            {/* Rating out of 10 slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Personal Rating out of 10</span>
                <span className="font-bold text-amber-400 font-mono">
                  {editRating.toFixed(1)} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={editRating}
                onChange={(e) => setEditRating(parseFloat(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            <Input
              label="Synopsis / Notes"
              value={editNotes}
              onChange={setEditNotes}
              placeholder="Notes or review comments..."
            />

            {/* Edit Genres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Genres & Tags
                </label>
                <span className="text-[11px] text-slate-400">
                  {editGenres.length} selected
                </span>
              </div>

              {/* Selected Tags Row with Remove Buttons */}
              {editGenres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-charcoal-750 border border-slate-200/80 dark:border-charcoal-600/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    Active Tags:
                  </span>
                  {editGenres.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg bg-teal-500/15 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-medium"
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditGenres((prev) => prev.filter((item) => item !== g))
                        }
                        className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Genre Tiles: Presets + Custom Added Tiles */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto py-1">
                {editGenreOptions.map((g) => {
                  const isSelected = editGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() =>
                        setEditGenres((prev) =>
                          prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
                        )
                      }
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                        isSelected
                          ? "bg-teal-500 text-charcoal-950 font-bold shadow-xs scale-102"
                          : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      <span>{g}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Genre Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type new custom tag (e.g. Anime, Mystery)..."
                  value={editCustomGenre}
                  onChange={(e) => setEditCustomGenre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (editCustomGenre.trim() && !editGenres.includes(editCustomGenre.trim())) {
                        setEditGenres((prev) => [...prev, editCustomGenre.trim()]);
                        setEditCustomGenre("");
                      }
                    }
                  }}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (editCustomGenre.trim() && !editGenres.includes(editCustomGenre.trim())) {
                      setEditGenres((prev) => [...prev, editCustomGenre.trim()]);
                      setEditCustomGenre("");
                    }
                  }}
                  disabled={!editCustomGenre.trim()}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
         DELETE SERIES CONFIRMATION MODAL
         ======================================================== */}
      {seriesToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Television Series"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Series
              </Button>
            </div>
          }
        >
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Permanent Record Removal</p>
              <p className="mt-1 leading-relaxed">
                Permanently delete <span className="font-semibold text-white">"{seriesToDelete.title}"</span> and all its seasons and episode watch records?
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
         EDIT EPISODE TITLE MODAL
         ======================================================== */}
      <Modal
        isOpen={isEditEpModalOpen}
        onClose={() => setIsEditEpModalOpen(false)}
        title="Rename Episode"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditEpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEpisodeTitle}
              disabled={!editingEpisodeTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Title
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Episode Title"
            value={editingEpisodeTitle}
            onChange={setEditingEpisodeTitle}
            placeholder="e.g. Good News About Hell"
            autoFocus
          />
        </div>
      </Modal>

      {/* ========================================================
         ADD SEASON MODAL
         ======================================================== */}
      <Modal
        isOpen={isAddSeasonModalOpen}
        onClose={() => setIsAddSeasonModalOpen(false)}
        title="Add New Season"
        description="Creates the next sequential season and generates initial episode checklists."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddSeasonModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAddSeason}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Season
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Initial Episode Count"
            value={newSeasonEpCount}
            onChange={setNewSeasonEpCount}
            type="number"
            min={1}
            max={100}
            autoFocus
          />
        </div>
      </Modal>

      {/* ========================================================
         ADD EPISODE MODAL
         ======================================================== */}
      <Modal
        isOpen={isAddEpModalOpen}
        onClose={() => setIsAddEpModalOpen(false)}
        title={`Add Episode to Season ${activeSeason?.seasonNumber}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddEpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAddEpisode}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Episode
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Episode Title (Optional)"
            value={newEpTitle}
            onChange={setNewEpTitle}
            placeholder={`e.g. Episode ${(activeSeason?.episodes.length || 0) + 1}`}
            autoFocus
          />
        </div>
      </Modal>

      {/* ========================================================
         AUTOMATIC COMPLETION CELEBRATION & RATING PROMPT
         ======================================================== */}
      <Modal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        title="🎉 Series Completed!"
        description="Every episode has been checked off! How would you rate this series overall?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompletionModalOpen(false)}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCompletionRating}
              icon={<Star className="w-3.5 h-3.5 fill-amber-400" />}
            >
              Save Rating
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {completionRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold ml-1">/ 10</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={completionRating}
            onChange={(e) => setCompletionRating(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </Modal>
    </div>
  );
};

export default SeriesPage;
