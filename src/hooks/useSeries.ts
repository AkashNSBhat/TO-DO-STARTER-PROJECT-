import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { SeriesDetail, SeriesFull } from "../lib/db/types";

export function useSeries(initialSelectedId: string | null = null) {
  const [series, setSeries] = useState<SeriesDetail[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(initialSelectedId);
  const [selectedSeries, setSelectedSeries] = useState<SeriesFull | null>(null);
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

  const toggleEpisode = useCallback(
    async (episodeId: string, isCompleted: boolean): Promise<boolean> => {
      // Optimistically update selectedSeries
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

        // Also update summary list
        setSeries((prevList) =>
          prevList.map((s) =>
            s.id === prev.id
              ? { ...s, completedEpisodes: totalComp, progressText }
              : s
          )
        );

        return {
          ...prev,
          completedEpisodes: totalComp,
          progressText,
          seasons: newSeasons,
        };
      });

      try {
        await DatabaseClient.toggleEpisodeCompletion(episodeId, isCompleted);
        return true;
      } catch (err) {
        console.error("[useSeries] Error toggling episode completion:", err);
        // Refresh on error
        if (selectedSeriesId) {
          selectSeries(selectedSeriesId);
        }
        fetchSeries();
        return false;
      }
    },
    [selectedSeriesId, selectSeries, fetchSeries]
  );

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
    selectedSeries,
    selectedSeriesId,
    selectSeries,
    toggleEpisode,
    loading,
    error,
    refetch: fetchSeries,
  };
}
