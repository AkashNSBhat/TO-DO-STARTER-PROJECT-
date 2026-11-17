import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import {
  SeriesDetail,
  SeriesFull,
  CreateSeriesInput,
  UpdateSeriesInput,
  SeasonDetail,
  EpisodeDetail,
  SeriesStatus,
  ToggleEpisodeResult,
} from "../lib/db/types";

export type SeriesFilter = "all" | "watching" | "completed" | "planned";

export function useSeries(initialSelectedId: string | null = null) {
  const [series, setSeries] = useState<SeriesDetail[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(initialSelectedId);
  const [selectedSeries, setSelectedSeries] = useState<SeriesFull | null>(null);
  const [statusFilter, setStatusFilter] = useState<SeriesFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getSeries();
      setSeries(res);
    } catch (err) {
      console.error("[useSeries] Error loading series:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSeries = useCallback(async (seriesId: string | null) => {
    setSelectedSeriesId(seriesId);
    if (!seriesId) {
      setSelectedSeries(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const detail = await DatabaseClient.getSeriesDetail(seriesId);
      setSelectedSeries(detail);
    } catch (err) {
      console.error(`[useSeries] Error loading series detail for ${seriesId}:`, err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createSeries = useCallback(
    async (input: CreateSeriesInput): Promise<SeriesFull | null> => {
      try {
        const created = await DatabaseClient.createSeries(input);
        const summary: SeriesDetail = {
          id: created.id,
          title: created.title,
          status: created.status as SeriesStatus,
          releaseYear: created.releaseYear,
          totalSeasons: created.totalSeasons,
          totalEpisodes: created.totalEpisodes,
          completedEpisodes: created.completedEpisodes,
          progressText: created.progressText,
          rating: created.rating,
          genres: created.genres,
          posterUrl: created.posterUrl,
          notes: created.notes,
        };
        setSeries((prev) => [summary, ...prev]);
        setSelectedSeries(created);
        setSelectedSeriesId(created.id);
        return created;
      } catch (err) {
        console.error("[useSeries] Error creating series:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    []
  );

  const updateSeries = useCallback(
    async (input: UpdateSeriesInput): Promise<boolean> => {
      try {
        await DatabaseClient.updateSeries(input);
        setSeries((prev) =>
          prev.map((s) =>
            s.id === input.id
              ? {
                  ...s,
                  title: input.title,
                  releaseYear: input.releaseYear,
                  status: input.status,
                  rating: input.rating,
                  notes: input.notes,
                  posterUrl: input.posterUrl,
                  genres: input.genres || s.genres,
                }
              : s
          )
        );
        if (selectedSeries && selectedSeries.id === input.id) {
          setSelectedSeries((prev) =>
            prev
              ? {
                  ...prev,
                  title: input.title,
                  releaseYear: input.releaseYear,
                  status: input.status,
                  rating: input.rating,
                  notes: input.notes,
                  posterUrl: input.posterUrl,
                  genres: input.genres || prev.genres,
                }
              : null
          );
        }
        return true;
      } catch (err) {
        console.error("[useSeries] Error updating series:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [selectedSeries]
  );

  const deleteSeries = useCallback(
    async (seriesId: string): Promise<boolean> => {
      try {
        await DatabaseClient.deleteSeries(seriesId);
        setSeries((prev) => prev.filter((s) => s.id !== seriesId));
        if (selectedSeriesId === seriesId) {
          setSelectedSeriesId(null);
          setSelectedSeries(null);
        }
        return true;
      } catch (err) {
        console.error("[useSeries] Error deleting series:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [selectedSeriesId]
  );

  const updateEpisodeTitle = useCallback(
    async (episodeId: string, title: string): Promise<boolean> => {
      try {
        await DatabaseClient.updateEpisodeTitle(episodeId, title);
        setSelectedSeries((prev) => {
          if (!prev) return prev;
          const newSeasons = prev.seasons.map((season) => ({
            ...season,
            episodes: season.episodes.map((ep) =>
              ep.id === episodeId ? { ...ep, title } : ep
            ),
          }));
          return { ...prev, seasons: newSeasons };
        });
        return true;
      } catch (err) {
        console.error("[useSeries] Error updating episode title:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    []
  );

  const toggleEpisode = useCallback(
    async (episodeId: string, isCompleted: boolean): Promise<ToggleEpisodeResult> => {
      // Optimistically update
      setSelectedSeries((prev) => {
        if (!prev) return prev;
        let totalComp = 0;
        const newSeasons = prev.seasons.map((season) => {
          const newEpisodes = season.episodes.map((ep) => {
            if (ep.id === episodeId) {
              const updated = {
                ...ep,
                isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              };
              if (updated.isCompleted) totalComp++;
              return updated;
            }
            if (ep.isCompleted) totalComp++;
            return ep;
          });
          return { ...season, episodes: newEpisodes };
        });

        const progressText = `${totalComp}/${prev.totalEpisodes} Episodes`;
        const seriesCompleted = prev.totalEpisodes > 0 && totalComp === prev.totalEpisodes;
        const newStatus = seriesCompleted ? ("completed" as SeriesStatus) : !isCompleted && prev.status === "completed" ? ("watching" as SeriesStatus) : prev.status;

        // Also update summary list
        setSeries((prevList) =>
          prevList.map((s) =>
            s.id === prev.id
              ? { ...s, completedEpisodes: totalComp, progressText, status: newStatus }
              : s
          )
        );

        return {
          ...prev,
          status: newStatus,
          completedEpisodes: totalComp,
          progressText,
          seasons: newSeasons,
        };
      });

      try {
        const result = await DatabaseClient.toggleEpisodeCompletion(episodeId, isCompleted);
        return result;
      } catch (err) {
        console.error("[useSeries] Error toggling episode completion:", err);
        if (selectedSeriesId) {
          selectSeries(selectedSeriesId);
        }
        fetchSeries();
        return {
          isCompleted: !isCompleted,
          seriesCompleted: false,
          totalEpisodes: 0,
          completedEpisodes: 0,
        };
      }
    },
    [selectedSeriesId, selectSeries, fetchSeries]
  );

  const rateSeries = useCallback(
    async (seriesId: string, rating: number): Promise<boolean> => {
      try {
        await DatabaseClient.rateSeries(seriesId, rating);
        setSeries((prev) =>
          prev.map((s) => (s.id === seriesId ? { ...s, rating } : s))
        );
        setSelectedSeries((prev) => (prev && prev.id === seriesId ? { ...prev, rating } : prev));
        return true;
      } catch (err) {
        console.error("[useSeries] Error rating series:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    []
  );

  const addSeason = useCallback(
    async (seriesId: string, episodeCount: number): Promise<SeasonDetail | null> => {
      try {
        const newSeason = await DatabaseClient.addSeason(seriesId, episodeCount);
        setSelectedSeries((prev) => {
          if (!prev) return prev;
          const seasons = [...prev.seasons, newSeason];
          const totalEpisodes = prev.totalEpisodes + episodeCount;
          return {
            ...prev,
            totalSeasons: seasons.length,
            totalEpisodes,
            progressText: `${prev.completedEpisodes}/${totalEpisodes} Episodes`,
            seasons,
          };
        });
        setSeries((prev) =>
          prev.map((s) =>
            s.id === seriesId
              ? {
                  ...s,
                  totalSeasons: s.totalSeasons + 1,
                  totalEpisodes: s.totalEpisodes + episodeCount,
                  progressText: `${s.completedEpisodes}/${s.totalEpisodes + episodeCount} Episodes`,
                }
              : s
          )
        );
        return newSeason;
      } catch (err) {
        console.error("[useSeries] Error adding season:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    []
  );

  const deleteSeason = useCallback(
    async (seasonId: string): Promise<boolean> => {
      try {
        await DatabaseClient.deleteSeason(seasonId);
        if (selectedSeriesId) {
          await selectSeries(selectedSeriesId);
        }
        await fetchSeries();
        return true;
      } catch (err) {
        console.error("[useSeries] Error deleting season:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [selectedSeriesId, selectSeries, fetchSeries]
  );

  const addEpisode = useCallback(
    async (seasonId: string, title?: string): Promise<EpisodeDetail | null> => {
      try {
        const newEp = await DatabaseClient.addEpisode(seasonId, title);
        setSelectedSeries((prev) => {
          if (!prev) return prev;
          const newSeasons = prev.seasons.map((season) => {
            if (season.id === seasonId) {
              return { ...season, episodes: [...season.episodes, newEp] };
            }
            return season;
          });
          const totalEpisodes = prev.totalEpisodes + 1;
          return {
            ...prev,
            totalEpisodes,
            progressText: `${prev.completedEpisodes}/${totalEpisodes} Episodes`,
            seasons: newSeasons,
          };
        });
        if (selectedSeries) {
          setSeries((prev) =>
            prev.map((s) =>
              s.id === selectedSeries.id
                ? {
                    ...s,
                    totalEpisodes: s.totalEpisodes + 1,
                    progressText: `${s.completedEpisodes}/${s.totalEpisodes + 1} Episodes`,
                  }
                : s
            )
          );
        }
        return newEp;
      } catch (err) {
        console.error("[useSeries] Error adding episode:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [selectedSeries]
  );

  const deleteEpisode = useCallback(
    async (episodeId: string): Promise<boolean> => {
      try {
        await DatabaseClient.deleteEpisode(episodeId);
        if (selectedSeriesId) {
          await selectSeries(selectedSeriesId);
        }
        await fetchSeries();
        return true;
      } catch (err) {
        console.error("[useSeries] Error deleting episode:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [selectedSeriesId, selectSeries, fetchSeries]
  );

  // Filter series by status and search query
  const filteredSeries = useMemo(() => {
    let list = series;
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.genres.some((g) => g.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [series, statusFilter, searchQuery]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  useEffect(() => {
    if (initialSelectedId) {
      selectSeries(initialSelectedId);
    }
  }, [initialSelectedId, selectSeries]);

  return {
    series,
    filteredSeries,
    selectedSeries,
    selectedSeriesId,
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
    error,
    refetch: fetchSeries,
  };
}
