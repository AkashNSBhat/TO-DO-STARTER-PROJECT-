import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import {
  ArchiveItem,
  ArchiveFilter,
  AddHistoricalInput,
  UpdateArchivedInput,
} from "../lib/db/types";

export type ArchiveSortOption = "date" | "rating" | "year" | "title";

export function useArchive(initialFilter: ArchiveFilter = "all") {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [filter, setFilter] = useState<ArchiveFilter>(initialFilter);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<ArchiveSortOption>("date");
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

  const addHistoricalEntry = useCallback(
    async (input: AddHistoricalInput): Promise<ArchiveItem | null> => {
      try {
        const created = await DatabaseClient.addHistoricalEntry(input);
        setItems((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        console.error("[useArchive] Error adding historical entry:", err);
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    []
  );

  const updateArchivedEntry = useCallback(
    async (input: UpdateArchivedInput): Promise<boolean> => {
      try {
        await DatabaseClient.updateArchivedEntry(input);
        setItems((prev) =>
          prev.map((i) =>
            i.id === input.id
              ? {
                  ...i,
                  title: input.title,
                  releaseYear: input.releaseYear,
                  rating: input.rating,
                  dateCompleted: input.dateCompleted || i.dateCompleted,
                  genres: input.genres || i.genres,
                  notes: input.notes,
                  totalSeasons: input.totalSeasons,
                  totalEpisodes: input.totalEpisodes,
                }
              : i
          )
        );
        return true;
      } catch (err) {
        console.error("[useArchive] Error updating archived entry:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    []
  );

  const deleteArchivedEntry = useCallback(
    async (id: string, itemType: string): Promise<boolean> => {
      try {
        await DatabaseClient.deleteArchivedEntry(id, itemType);
        setItems((prev) => prev.filter((i) => i.id !== id));
        return true;
      } catch (err) {
        console.error("[useArchive] Error deleting archived entry:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    []
  );

  const checkDuplicate = useCallback(
    async (title: string, releaseYear: number | undefined, itemType: string): Promise<boolean> => {
      return await DatabaseClient.checkArchiveDuplicate(title, releaseYear, itemType);
    },
    []
  );

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

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
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

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          item.title.toLowerCase().includes(q) ||
          item.genres.some((g) => g.toLowerCase().includes(q)) ||
          (item.notes ? item.notes.toLowerCase().includes(q) : false);
      }

      return matchesType && matchesGenre && matchesYear && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sortBy === "year") {
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      // Default: date completed descending
      return b.dateCompleted.localeCompare(a.dateCompleted);
    });
  }, [items, filter, genreFilter, yearFilter, searchQuery, sortBy]);

  return {
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
    error,
    refetch: fetchArchive,
  };
}
