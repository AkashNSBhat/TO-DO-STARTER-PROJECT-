import React, { useState, useMemo } from "react";
import {
  Film,
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  Calendar,
  Clapperboard,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";
import { useMovies } from "../hooks";
import { MovieDetail, MovieFilter, MovieStatus } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { cn } from "../lib/utils";

export const MoviesPage: React.FC = () => {
  const {
    movies,
    filteredMovies,
    statusFilter,
    setStatusFilter,
    genreFilter,
    setGenreFilter,
    availableGenres,
    loading,
    error,
  } = useMovies("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"title" | "year" | "rating">("rating");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);

  // New Movie Form State
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<string>("2024");
  const [newStatus, setNewStatus] = useState<MovieStatus>("planned");
  const [newRating, setNewRating] = useState<string>("8.0");
  const [newGenres, setNewGenres] = useState<string[]>(["Sci-Fi"]);
  const [newNotes, setNewNotes] = useState("");

  // Counts for status tabs
  const counts = useMemo(() => {
    return {
      all: movies.length,
      planned: movies.filter((m) => m.status === "planned").length,
      watching: movies.filter((m) => m.status === "watching").length,
      completed: movies.filter((m) => m.status === "completed").length,
    };
  }, [movies]);

  // Search and Sort Filtering
  const displayedMovies = useMemo(() => {
    let result = filteredMovies.filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q) ?? false;
      const matchGenre = m.genres.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchNotes || matchGenre;
    });

    return result.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === "year") {
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      }
      return a.title.localeCompare(b.title);
    });
  }, [filteredMovies, searchQuery, sortBy]);

  const statusBadgeVariant = (status: MovieStatus): "success" | "teal" | "amber" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "watching":
        return "teal";
      case "planned":
        return "amber";
      default:
        return "default";
    }
  };

  const statusIcon = (status: MovieStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "watching":
        return <PlayCircle className="w-3.5 h-3.5 text-teal-400" />;
      case "planned":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const handleCreateMovieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Local state addition for responsive client UI
    const created: MovieDetail = {
      id: `mov-${Date.now()}`,
      title: newTitle.trim(),
      releaseYear: parseInt(newYear, 10) || undefined,
      status: newStatus,
      rating: parseFloat(newRating) || undefined,
      genres: newGenres,
      notes: newNotes.trim() || undefined,
      isHistorical: false,
      dateWatched: newStatus === "completed" ? new Date().toISOString().slice(0, 10) : undefined,
    };

    movies.unshift(created);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewNotes("");
  };

  const toggleGenreSelection = (genre: string) => {
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
              <Film className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Movie Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track planned films, active screenings, and permanent completion archives with personal ratings out of 10.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Movie
          </Button>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-charcoal-700 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800/80 border border-slate-200/80 dark:border-charcoal-700/80">
          {(["all", "planned", "watching", "completed"] as MovieFilter[]).map((tab) => {
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
          })}
        </div>

        {/* View Toggle & Sorting Controls */}
        <div className="flex items-center gap-2">
          {/* Genre Filter */}
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

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "title" | "year" | "rating")}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="rating">Rating (Highest)</option>
            <option value="year">Year (Newest)</option>
            <option value="title">Title (A-Z)</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-white dark:bg-charcoal-700 text-teal-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-charcoal-700 text-teal-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-md">
        <Input
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, director, notes, or genre..."
          icon={Search}
          clearable
          inputSize="sm"
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-slate-100 dark:bg-charcoal-800/50 border border-slate-200 dark:border-charcoal-700/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <Card className="p-6 text-center border-rose-500/30 bg-rose-500/10">
          <p className="text-xs text-rose-400">Failed to load movies: {error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && displayedMovies.length === 0 && (
        <Card className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
            <Clapperboard className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No movies match your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
            {searchQuery
              ? `No movie titles or notes found containing "${searchQuery}".`
              : `Your ${statusFilter} list is currently empty. Add your favorite movies to begin tracking.`}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add First Movie
          </Button>
        </Card>
      )}

      {/* Movies Grid View */}
      {!loading && viewMode === "grid" && displayedMovies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedMovies.map((movie) => {
            return (
              <div
                key={movie.id}
                onClick={() => setSelectedMovie(movie)}
                className="group relative flex flex-col rounded-xl bg-white dark:bg-charcoal-800/90 border border-slate-200/80 dark:border-charcoal-700/80 hover:border-teal-500/40 dark:hover:border-teal-500/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              >
                {/* Poster / Artistic Visual Thumbnail */}
                <div
                  className="h-36 w-full relative flex items-center justify-center p-4 bg-gradient-to-br from-charcoal-850 via-charcoal-800 to-charcoal-900 border-b border-slate-100 dark:border-charcoal-700/50"
                  style={{
                    backgroundColor: movie.posterColor || undefined,
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shadow-inner group-hover:scale-105 transition-transform">
                    <Film className="w-6 h-6" />
                  </div>

                  {/* Rating Badge Overlay */}
                  {movie.rating !== undefined && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-charcoal-950/80 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold shadow-md">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-charcoal-950/80 backdrop-blur-md border border-white/10 text-[10px] font-medium">
                    {statusIcon(movie.status)}
                    <span className="capitalize text-slate-300">
                      {movie.status}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-teal-500 transition-colors">
                        {movie.title}
                      </h3>
                      {movie.releaseYear && (
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {movie.releaseYear}
                        </span>
                      )}
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {movie.genres.map((g) => (
                        <span
                          key={g}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-charcoal-600/50"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notes or Completion Date Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-charcoal-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    {movie.dateWatched ? (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                        <Calendar className="w-3 h-3" />
                        {movie.dateWatched}
                      </span>
                    ) : (
                      <span className="italic text-[10px] text-slate-400 line-clamp-1">
                        {movie.notes || "No notes"}
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Movies Table View */}
      {!loading && viewMode === "table" && displayedMovies.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-charcoal-700 overflow-hidden bg-white dark:bg-charcoal-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-charcoal-850 border-b border-slate-200 dark:border-charcoal-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-3">Year</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Genres</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-4">Watched Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-charcoal-700/60">
                {displayedMovies.map((movie) => (
                  <tr
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="hover:bg-slate-50 dark:hover:bg-charcoal-750 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Film className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{movie.title}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {movie.releaseYear || "—"}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={statusBadgeVariant(movie.status)}>
                        {movie.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-400">
                      {movie.rating ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {movie.dateWatched || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Movie"
        description="Record a film to your planned watchlist, active viewing, or permanent archive."
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
              onClick={handleCreateMovieSubmit}
              disabled={!newTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save Movie
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateMovieSubmit} className="space-y-4">
          <Input
            label="Movie Title *"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="e.g. Blade Runner 2049"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Release Year"
              value={newYear}
              onChange={setNewYear}
              placeholder="e.g. 2017"
              type="number"
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Viewing Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as MovieStatus)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="planned">Planned (Watchlist)</option>
                <option value="watching">Currently Watching</option>
                <option value="completed">Completed (Archived)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Rating (/10)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
                className="flex-1 accent-teal-500 cursor-pointer"
              />
              <span className="font-mono text-sm font-bold text-amber-400 w-10 text-right">
                {parseFloat(newRating).toFixed(1)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Sci-Fi",
                "Action",
                "Drama",
                "Thriller",
                "Crime",
                "Comedy",
                "Documentary",
                "Animation",
              ].map((g) => {
                const isSelected = newGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenreSelection(g)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-teal-500 text-charcoal-950 font-bold"
                        : "bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-charcoal-600"
                    )}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Notes / Thoughts
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Atmospheric cinematography, Hans Zimmer score..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Inspect Movie Detail Modal */}
      {selectedMovie && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMovie(null)}
          title={selectedMovie.title}
          description={`Released in ${selectedMovie.releaseYear || "Unknown"} • Status: ${selectedMovie.status}`}
          size="md"
          footer={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedMovie(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700">
              <div className="flex items-center gap-2">
                <Badge variant={statusBadgeVariant(selectedMovie.status)}>
                  {selectedMovie.status}
                </Badge>
                {selectedMovie.dateWatched && (
                  <span className="text-xs text-slate-400 font-mono">
                    Watched: {selectedMovie.dateWatched}
                  </span>
                )}
              </div>
              {selectedMovie.rating !== undefined && (
                <div className="flex items-center gap-1 font-bold text-amber-400 text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{selectedMovie.rating.toFixed(1)} / 10</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Genres
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedMovie.genres.map((g) => (
                  <Badge key={g} variant="default">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedMovie.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Personal Review & Notes
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-3 rounded-lg bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
                  {selectedMovie.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
