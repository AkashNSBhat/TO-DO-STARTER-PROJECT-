import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import { ArchiveItem, ArchiveFilter } from "../lib/db/types";

export function useArchive(initialFilter: ArchiveFilter = "all") {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [filter, setFilter] = useState<ArchiveFilter>(initialFilter);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArchive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getArchiveData("all");
      setItems(res);
    } catch (err) {
      console.error("[useArchive] Error loading archive data:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  // Extract all distinct genres across archive items
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const g of item.genres) {
        set.add(g);
      }
    }
    return Array.from(set).sort();
  }, [items]);

  // Extract all distinct release years across archive items (sorted descending)
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const item of items) {
      if (item.releaseYear) {
        set.add(item.releaseYear);
      }
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  // Filtered items by type, genre, and release year
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType =
        filter === "all"
          ? true
          : filter === "movies" || filter === "movie"
          ? item.type === "movie"
          : item.type === "series";

      const matchesGenre =
        genreFilter === "all" ? true : item.genres.includes(genreFilter);

      const matchesYear =
        yearFilter === "all" ? true : String(item.releaseYear) === yearFilter;

      return matchesType && matchesGenre && matchesYear;
    });
  }, [items, filter, genreFilter, yearFilter]);

  return {
    items,
    filteredItems,
    filter,
    setFilter,
    genreFilter,
    setGenreFilter,
    yearFilter,
    setYearFilter,
    availableGenres,
    availableYears,
    loading,
    error,
    refetch: fetchArchive,
  };
}
