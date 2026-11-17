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
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useArchive, ArchiveSortOption } from "../hooks";
import { ArchiveItem, ArchiveFilter, AddHistoricalInput, UpdateArchivedInput } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { cn } from "../lib/utils";

const PRESET_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Mystery",
  "Sci-Fi",
  "Thriller",
];

export const ArchivePage: React.FC = () => {
  const {
    items,
    filteredItems,
    filter,
    setFilter,
    genreFilter,
    setGenreFilter,
    yearFilter,
    setYearFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    availableGenres,
    availableYears,
    addHistoricalEntry,
    updateArchivedEntry,
    deleteArchivedEntry,
    checkDuplicate,
    loading,
  } = useArchive("all");

  // Modal States
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Historical entry form state
  const [histTitle, setHistTitle] = useState("");
  const [histType, setHistType] = useState<"movie" | "series">("movie");
  const [histYear, setHistYear] = useState<string>("2023");
  const [histRating, setHistRating] = useState<number>(9.0);
  const [histDateMode, setHistDateMode] = useState<"approximate" | "exact">("approximate");
  const [histApproxYear, setHistApproxYear] = useState<string>("2023");
  const [histExactDate, setHistExactDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [histGenres, setHistGenres] = useState<string[]>(["Sci-Fi"]);
  const [histCustomGenre, setHistCustomGenre] = useState("");
  const [histSeasons, setHistSeasons] = useState("1");
  const [histEpisodes, setHistEpisodes] = useState("10");
  const [histNotes, setHistNotes] = useState("");
  const [histError, setHistError] = useState<string | null>(null);

  // Edit item form state
  const [itemToEdit, setItemToEdit] = useState<ArchiveItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editRating, setEditRating] = useState<number>(8.5);
  const [editDate, setEditDate] = useState("");
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editSeasons, setEditSeasons] = useState("");
  const [editEpisodes, setEditEpisodes] = useState("");

  // Delete item state
  const [itemToDelete, setItemToDelete] = useState<ArchiveItem | null>(null);

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

  // Handle open Add Historical modal
  const handleOpenAddModal = () => {
    setHistTitle("");
    setHistType("movie");
    setHistYear(new Date().getFullYear().toString());
    setHistRating(9.0);
    setHistDateMode("approximate");
    setHistApproxYear(new Date().getFullYear().toString());
    setHistExactDate(new Date().toISOString().slice(0, 10));
    setHistGenres(["Sci-Fi"]);
    setHistCustomGenre("");
    setHistSeasons("1");
    setHistEpisodes("10");
    setHistNotes("");
    setHistError(null);
    setIsHistoricalModalOpen(true);
  };

  const toggleHistGenre = (g: string) => {
    setHistGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const handleAddHistCustomGenre = () => {
    const trimmed = histCustomGenre.trim();
    if (trimmed && !histGenres.includes(trimmed)) {
      setHistGenres((prev) => [...prev, trimmed]);
      setHistCustomGenre("");
    }
  };

  const handleCreateHistoricalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHistError(null);
    if (!histTitle.trim()) {
      setHistError("Title is required.");
      return;
    }

    const relYear = histYear.trim() ? parseInt(histYear, 10) : undefined;

    // 5.13 Duplicate prevention check
    const isDup = await checkDuplicate(histTitle.trim(), relYear, histType);
    if (isDup) {
      setHistError(
        `A completed ${histType} titled "${histTitle.trim()}" (${relYear || "N/A"}) already exists in your archive.`
      );
      return;
    }

    const dateCompleted =
      histDateMode === "approximate" ? `${histApproxYear}-01-01` : histExactDate;

    const payload: AddHistoricalInput = {
      itemType: histType,
      title: histTitle.trim(),
      releaseYear: relYear,
      rating: histRating,
      genres: histGenres,
      dateCompleted,
      totalSeasons: histType === "series" ? parseInt(histSeasons, 10) || 1 : undefined,
      totalEpisodes: histType === "series" ? parseInt(histEpisodes, 10) || undefined : undefined,
      notes: histNotes.trim() || undefined,
    };

    try {
      await addHistoricalEntry(payload);
      setIsHistoricalModalOpen(false);
    } catch (err: any) {
      setHistError(err.message || String(err));
    }
  };

  // Handle open Edit modal
  const handleOpenEditModal = (item: ArchiveItem) => {
    setItemToEdit(item);
    setEditTitle(item.title);
    setEditYear(item.releaseYear ? item.releaseYear.toString() : "");
    setEditRating(item.rating ?? 8.0);
    setEditDate(item.dateCompleted);
    setEditGenres(item.genres || []);
    setEditNotes(item.notes || "");
    setEditSeasons(item.totalSeasons ? item.totalSeasons.toString() : "");
    setEditEpisodes(item.totalEpisodes ? item.totalEpisodes.toString() : "");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !editTitle.trim()) return;

    const relYear = editYear.trim() ? parseInt(editYear, 10) : undefined;
    const payload: UpdateArchivedInput = {
      id: itemToEdit.id,
      itemType: itemToEdit.type,
      title: editTitle.trim(),
      releaseYear: relYear,
      rating: editRating,
      dateCompleted: editDate || itemToEdit.dateCompleted,
      genres: editGenres,
      notes: editNotes.trim() || undefined,
      totalSeasons: itemToEdit.type === "series" ? parseInt(editSeasons, 10) || undefined : undefined,
      totalEpisodes: itemToEdit.type === "series" ? parseInt(editEpisodes, 10) || undefined : undefined,
    };

    const ok = await updateArchivedEntry(payload);
    if (ok) {
      setIsEditModalOpen(false);
      setItemToEdit(null);
    }
  };

  // Handle open Delete modal
  const handleOpenDeleteModal = (item: ArchiveItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteArchivedEntry(itemToDelete.id, itemToDelete.type);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
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
            onClick={handleOpenAddModal}
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
            Every title marked completed stays in this archive permanently with exact ratings, genre attributes, and completion timestamps. Records survive all workflows.
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
        {/* Type Segmented Tabs: All, Movies, Series */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
          {(["all", "movies", "series"] as ArchiveFilter[]).map((tab) => {
            const isActive = filter === tab;
            const count =
              tab === "all"
                ? summary.total
                : tab === "movies"
                ? summary.moviesCount
                : summary.seriesCount;
            const label =
              tab === "all" ? "All Media" : tab === "movies" ? "Movies" : "TV Series";
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-charcoal-700 text-teal-600 dark:text-teal-400 font-bold shadow-sm"
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
          })}
        </div>

        {/* Secondary Filters: Genre, Year, Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Genre selector */}
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

          {/* Year selector */}
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

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ArchiveSortOption)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="date">Completed (Newest)</option>
            <option value="rating">Rating (Highest)</option>
            <option value="year">Release Year (Newest)</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search archive by title, genre, or notes..."
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
      {!loading && filteredItems.length === 0 && (
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
            onClick={handleOpenAddModal}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Past Completion
          </Button>
        </Card>
      )}

      {/* Archive Items Grid/List */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 hover:border-teal-500/40 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 mt-0.5",
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

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h3>
                    {item.releaseYear && (
                      <span className="text-[11px] font-mono text-slate-400">
                        ({item.releaseYear})
                      </span>
                    )}
                    {item.isHistorical && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-charcoal-700 text-teal-400 border border-teal-500/30 font-medium">
                        Historical
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400">
                      {item.type === "movie" ? "Movie" : "TV Series"}
                    </span>
                    {item.type === "series" && item.totalSeasons && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-teal-400" />
                        {item.totalSeasons} Seasons
                        {item.totalEpisodes ? ` • ${item.totalEpisodes} Eps` : ""}
                      </span>
                    )}
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

              {/* Rating, Completion Date, and Edit/Delete Actions */}
              <div className="text-right shrink-0 space-y-2">
                <div>
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
                  <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>{item.dateCompleted.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors"
                    title="Edit Record"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(item)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
         ADD HISTORICAL ENTRY MODAL (5.7, 5.8, 5.9, 5.10, 5.13)
         ======================================================== */}
      <Modal
        isOpen={isHistoricalModalOpen}
        onClose={() => setIsHistoricalModalOpen(false)}
        title="Add Historical Completion"
        description="Record a movie or TV series you previously finished so your lifetime entertainment archive is complete."
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
          {histError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{histError}</span>
            </div>
          )}

          <Input
            label="Title *"
            value={histTitle}
            onChange={setHistTitle}
            placeholder="e.g. Interstellar, Breaking Bad"
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
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
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

          {/* For Series: Optional Historical Seasons & Episodes */}
          {histType === "series" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
              <Input
                label="Total Seasons Finished"
                value={histSeasons}
                onChange={setHistSeasons}
                type="number"
                placeholder="e.g. 5"
              />
              <Input
                label="Total Episodes (Approx.)"
                value={histEpisodes}
                onChange={setHistEpisodes}
                type="number"
                placeholder="e.g. 62"
              />
            </div>
          )}

          {/* Completion Date Mode: Approximate Year vs Exact Date */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              When did you finish watching?
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistDateMode("approximate")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer",
                  histDateMode === "approximate"
                    ? "bg-teal-500 text-charcoal-950 font-bold border-teal-500"
                    : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-600"
                )}
              >
                Approximate Year
              </button>
              <button
                type="button"
                onClick={() => setHistDateMode("exact")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer",
                  histDateMode === "exact"
                    ? "bg-teal-500 text-charcoal-950 font-bold border-teal-500"
                    : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-charcoal-600"
                )}
              >
                Exact Date
              </button>
            </div>

            {histDateMode === "approximate" ? (
              <Input
                label="Approximate Completion Year"
                value={histApproxYear}
                onChange={setHistApproxYear}
                placeholder="e.g. 2021"
                type="number"
              />
            ) : (
              <Input
                label="Exact Watched Date"
                value={histExactDate}
                onChange={setHistExactDate}
                type="date"
              />
            )}
          </div>

          {/* Personal Rating out of 10 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span>Personal Rating out of 10</span>
              <span className="font-bold text-amber-400 font-mono">
                {histRating.toFixed(1)} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={histRating}
              onChange={(e) => setHistRating(parseFloat(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          <Input
            label="Personal Notes / Review (Optional)"
            value={histNotes}
            onChange={setHistNotes}
            placeholder="Key takeaways, memorable scenes, or thoughts..."
          />

          {/* Genres Tag Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Genres & Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_GENRES.map((g) => {
                const isSelected = histGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleHistGenre(g)}
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
              })}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Custom genre..."
                value={histCustomGenre}
                onChange={(e) => setHistCustomGenre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddHistCustomGenre();
                  }
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-charcoal-600 bg-slate-50 dark:bg-charcoal-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddHistCustomGenre}
                disabled={!histCustomGenre.trim()}
              >
                Add Tag
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================
         EDIT ARCHIVED RECORD MODAL (5.12)
         ======================================================== */}
      {itemToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Archive: ${itemToEdit.title}`}
          description="Update personal ratings, completion timestamps, and review notes."
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
                onClick={handleEditSubmit}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Title *"
              value={editTitle}
              onChange={setEditTitle}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Release Year"
                value={editYear}
                onChange={setEditYear}
                type="number"
              />
              <Input
                label="Completion Date"
                value={editDate}
                onChange={setEditDate}
                type="date"
              />
            </div>

            {itemToEdit.type === "series" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total Seasons"
                  value={editSeasons}
                  onChange={setEditSeasons}
                  type="number"
                />
                <Input
                  label="Total Episodes"
                  value={editEpisodes}
                  onChange={setEditEpisodes}
                  type="number"
                />
              </div>
            )}

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
              label="Personal Review / Notes"
              value={editNotes}
              onChange={setEditNotes}
              placeholder="Review thoughts..."
            />

            {/* Genres */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Genres
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_GENRES.map((g) => {
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
                        "text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        isSelected
                          ? "bg-teal-500 text-charcoal-950 font-bold"
                          : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
         DELETE ARCHIVED RECORD CONFIRMATION MODAL
         ======================================================== */}
      {itemToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Remove from Archive"
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
                Delete Record
              </Button>
            </div>
          }
        >
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Delete Archived Item</p>
              <p className="mt-1 leading-relaxed">
                Permanently delete <span className="font-semibold text-white">"{itemToDelete.title}"</span> from your archive?
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ArchivePage;
