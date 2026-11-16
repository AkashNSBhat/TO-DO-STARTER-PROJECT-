import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import { MovieDetail, MovieFilter } from "../lib/db/types";

export function useMovies(initialFilter: MovieFilter = "all") {
  const [movies, setMovies] = useState<MovieDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState<MovieFilter>(initialFilter);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getMovies("all");
      setMovies(res);
    } catch (err) {
      console.error("[useMovies] Error loading movies:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Extract all distinct genres across movies
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const m of movies) {
      for (const g of m.genres) {
        set.add(g);
      }
    }
    return Array.from(set).sort();
  }, [movies]);

  // Filtered movies by status and genre
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesStatus =
        statusFilter === "all" ? true : m.status === statusFilter;
      const matchesGenre =
        genreFilter === "all" ? true : m.genres.includes(genreFilter);
      return matchesStatus && matchesGenre;
    });
  }, [movies, statusFilter, genreFilter]);

  return {
    movies,
    filteredMovies,
    statusFilter,
    setStatusFilter,
    genreFilter,
    setGenreFilter,
    availableGenres,
    loading,
    error,
    refetch: fetchMovies,
  };
}
