import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import {
  MovieDetail,
  MovieFilter,
  CreateMovieInput,
  UpdateMovieInput,
} from "../lib/db/types";

export type MovieSortOption = "rating" | "year" | "title" | "dateWatched";

export function useMovies(initialFilter: MovieFilter = "all") {
  const [movies, setMovies] = useState<MovieDetail[]>([]);
  const [allGenresList, setAllGenresList] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<MovieFilter>(initialFilter);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<MovieSortOption>("rating");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resMovies, resGenres] = await Promise.all([
        DatabaseClient.getMovies("all"),
        DatabaseClient.getAllGenres(),
      ]);
      setMovies(resMovies);
      setAllGenresList(resGenres);
    } catch (err) {
      console.error("[useMovies] Error loading movies:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createMovie = useCallback(
    async (input: CreateMovieInput): Promise<MovieDetail | null> => {
      try {
        const created = await DatabaseClient.createMovie(input);
        setMovies((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        console.error("[useMovies] Error creating movie:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    []
  );

  const updateMovie = useCallback(
    async (input: UpdateMovieInput): Promise<boolean> => {
      try {
        await DatabaseClient.updateMovie(input);
        setMovies((prev) =>
          prev.map((m) =>
            m.id === input.id
              ? {
                  ...m,
                  title: input.title,
                  releaseYear: input.releaseYear,
                  status: input.status,
                  rating: input.rating,
                  dateWatched: input.dateWatched,
                  genres: input.genres || m.genres,
                  notes: input.notes,
                  posterUrl: input.posterUrl,
                  posterColor: input.posterColor || m.posterColor,
                }
              : m
          )
        );
        return true;
      } catch (err) {
        console.error("[useMovies] Error updating movie:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    []
  );

  const deleteMovie = useCallback(
    async (movieId: string): Promise<boolean> => {
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      try {
        await DatabaseClient.deleteMovie(movieId);
        return true;
      } catch (err) {
        console.error("[useMovies] Error deleting movie:", err);
        fetchMovies();
        return false;
      }
    },
    [fetchMovies]
  );

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Extract all distinct genres across movies plus master genres table
  const availableGenres = useMemo(() => {
    const set = new Set<string>(allGenresList);
    for (const m of movies) {
      for (const g of m.genres) {
        if (g && g.trim()) set.add(g.trim());
      }
    }
    return Array.from(set).sort();
  }, [movies, allGenresList]);

  // Filtered and sorted movies
  const filteredMovies = useMemo(() => {
    let result = movies.filter((m) => {
      // Status filter
      if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Genre filter
      if (genreFilter !== "all" && !m.genres.includes(genreFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchNotes = m.notes?.toLowerCase().includes(q) ?? false;
        const matchGenre = m.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchTitle && !matchNotes && !matchGenre) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating ?? -1) - (a.rating ?? -1);
      }
      if (sortBy === "year") {
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      }
      if (sortBy === "dateWatched") {
        return (b.dateWatched || "").localeCompare(a.dateWatched || "");
      }
      return a.title.localeCompare(b.title);
    });
  }, [movies, statusFilter, genreFilter, searchQuery, sortBy]);

  return {
    movies,
    filteredMovies,
    statusFilter,
    setStatusFilter,
    genreFilter,
    setGenreFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    availableGenres,
    loading,
    error,
    refetch: fetchMovies,
    createMovie,
    updateMovie,
    deleteMovie,
  };
}
