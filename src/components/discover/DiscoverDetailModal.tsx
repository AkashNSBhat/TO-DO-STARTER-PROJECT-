import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Plus,
  Check,
  Film,
  Tv,
  Globe,
  Calendar,
  Layers,
  Clock,
  Info,
  Volume2,
  FileText,
} from "lucide-react";
import { MediaCatalogItem } from "../../lib/catalog/types";
import { CatalogueClient } from "../../lib/catalog/client";

interface DiscoverDetailModalProps {
  item: MediaCatalogItem | null;
  onClose: () => void;
  onAddedToWatchlist?: () => void;
}

export const DiscoverDetailModal: React.FC<DiscoverDetailModalProps> = ({
  item,
  onClose,
  onAddedToWatchlist,
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [activeSeasonTab, setActiveSeasonTab] = useState<number>(1);

  useEffect(() => {
    if (!item) return;
    let mounted = true;
    CatalogueClient.isItemInWatchlist(
      item.primaryTitle,
      item.releaseYear,
      item.mediaType
    ).then((inList) => {
      if (mounted) setIsInWatchlist(inList);
    });
    return () => {
      mounted = false;
    };
  }, [item]);

  if (!item) return null;

  const handleAdd = async () => {
    if (isInWatchlist || isAdding) return;
    setIsAdding(true);
    setFeedbackMessage(null);

    const res = await CatalogueClient.addToWatchlist(item);
    setIsAdding(false);

    if (res.success || res.alreadyExisted) {
      setIsInWatchlist(true);
      setFeedbackMessage(res.message);
      onAddedToWatchlist?.();
    } else {
      setFeedbackMessage(res.message);
    }
  };

  const selectedSeason = item.seasons?.find(
    (s) => s.seasonNumber === activeSeasonTab
  );

  const originalLanguages = item.languages?.filter((l) => l.isOriginal) || [];
  const dubbedLanguages = item.languages?.filter((l) => l.isDubbed) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in">
      {/* Modal Dialog Container */}
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-charcoal-900 border border-charcoal-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-800 bg-charcoal-900/90 z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {item.mediaType === "movie" ? (
                <Film className="w-4 h-4" />
              ) : (
                <Tv className="w-4 h-4" />
              )}
            </span>
            <div>
              <h2 className="text-base font-bold text-charcoal-100 line-clamp-1">
                {item.primaryTitle}
              </h2>
              <span className="text-xs text-charcoal-400">
                {item.mediaType === "movie" ? "Feature Film" : "Television & Web Series"} • {item.releaseYear}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner: Poster & Primary Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster Thumbnail */}
            <div className="w-36 sm:w-44 aspect-[2/3] shrink-0 rounded-xl bg-charcoal-950 border border-charcoal-700/80 overflow-hidden shadow-md">
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.primaryTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-charcoal-500 text-xs">
                  <Film className="w-8 h-8 mb-1" />
                  No Poster
                </div>
              )}
            </div>

            {/* Core Info & Metadata Badges */}
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <h1 className="text-xl font-bold text-charcoal-50">
                  {item.primaryTitle}
                </h1>
                {item.originalTitle !== item.primaryTitle && (
                  <p className="text-xs text-charcoal-400 italic">
                    Original Title:{" "}
                    <span className="text-charcoal-300 font-medium">
                      {item.originalTitle}
                    </span>
                  </p>
                )}
              </div>

              {/* Badges: Rating, Year, Media Type, Seasons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {item.rating.toFixed(1)} / 10
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
                  <Calendar className="w-3 h-3 text-teal-400" />
                  {item.releaseYear}
                </span>

                {item.mediaType === "series" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    <Layers className="w-3 h-3" />
                    {item.totalSeasons || item.seasons?.length || 1} Season
                    {(item.totalSeasons || item.seasons?.length || 1) > 1 ? "s" : ""} •{" "}
                    {item.totalEpisodes || 0} Episodes
                  </span>
                )}
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-charcoal-800 text-charcoal-300 border border-charcoal-700/60"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Description / Synopsis */}
              <p className="text-xs sm:text-sm text-charcoal-300 leading-relaxed pt-2">
                {item.description}
              </p>
            </div>
          </div>

          {/* Section: Language Information & Verification Matrix */}
          <div className="p-4 rounded-xl bg-charcoal-950/60 border border-charcoal-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-charcoal-200 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Language & Audio Matrix</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Original Audio */}
              <div className="p-3 rounded-lg bg-charcoal-900 border border-charcoal-800">
                <div className="flex items-center gap-1.5 font-semibold text-charcoal-200 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>Original Language Audio</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {originalLanguages.length > 0 ? (
                    originalLanguages.map((ol) => (
                      <span
                        key={ol.id}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20"
                      >
                        {ol.languageName} ({ol.languageCode.toUpperCase()})
                      </span>
                    ))
                  ) : (
                    <span className="text-charcoal-400 text-xs">
                      {item.originalLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Verified Dubbed Audio */}
              <div className="p-3 rounded-lg bg-charcoal-900 border border-charcoal-800">
                <div className="flex items-center gap-1.5 font-semibold text-charcoal-200 mb-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified Dubbed Audio Tracks</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dubbedLanguages.length > 0 ? (
                    dubbedLanguages.map((dl) => (
                      <span
                        key={dl.id}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {dl.languageName}
                      </span>
                    ))
                  ) : (
                    <span className="text-charcoal-500 italic text-[11px]">
                      No additional verified dubbed audio recorded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Note on dubbed vs translated verification */}
            <p className="text-[11px] text-charcoal-500 flex items-center gap-1 pt-1">
              <Info className="w-3 h-3 text-charcoal-400 shrink-0" />
              <span>
                Verified audio tracks reflect official audio availability. Dubbed audio is never inferred from translated titles.
              </span>
            </p>
          </div>

          {/* Section: Alternate & Localized Titles (if available) */}
          {item.alternateTitles && item.alternateTitles.length > 0 && (
            <div className="p-4 rounded-xl bg-charcoal-950/60 border border-charcoal-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-200 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Alternate & Translated Titles</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {item.alternateTitles.map((at) => (
                  <span
                    key={at.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-charcoal-900 text-charcoal-300 border border-charcoal-800"
                  >
                    <span className="font-semibold text-teal-400 uppercase text-[10px]">
                      {at.language}:
                    </span>
                    <span>{at.title}</span>
                    <span className="text-[10px] text-charcoal-500">
                      ({at.type})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: Seasons & Episodes (for Series) */}
          {item.mediaType === "series" && item.seasons && item.seasons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-charcoal-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Season Breakdown ({item.seasons.length} Seasons)</span>
                </h3>
              </div>

              {/* Season Selection Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {item.seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSeasonTab(s.seasonNumber)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSeasonTab === s.seasonNumber
                        ? "bg-indigo-600 text-white font-semibold shadow-sm"
                        : "bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700"
                    }`}
                  >
                    Season {s.seasonNumber} ({s.episodeCount} eps)
                  </button>
                ))}
              </div>

              {/* Episode List for Active Season */}
              {selectedSeason && selectedSeason.episodes && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-charcoal-950/70 border border-charcoal-800">
                  {selectedSeason.episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900/60 hover:bg-charcoal-850 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded flex items-center justify-center bg-charcoal-800 text-charcoal-300 font-mono font-bold text-[11px]">
                          {ep.episodeNumber}
                        </span>
                        <div>
                          <p className="font-medium text-charcoal-200">
                            {ep.title}
                          </p>
                          {ep.overview && (
                            <p className="text-[11px] text-charcoal-500 line-clamp-1">
                              {ep.overview}
                            </p>
                          )}
                        </div>
                      </div>

                      {ep.runtimeMinutes && (
                        <span className="flex items-center gap-1 text-[11px] text-charcoal-500 font-mono shrink-0">
                          <Clock className="w-3 h-3" />
                          {ep.runtimeMinutes}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legal / Non-Commercial Attribution Notice */}
          <div className="pt-2 border-t border-charcoal-800/80">
            <p className="text-[11px] text-charcoal-500 leading-normal">
              {item.attribution}
            </p>
          </div>
        </div>

        {/* Modal Footer Bar with Watchlist Action */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-charcoal-800 bg-charcoal-900/90 z-10">
          <div>
            {feedbackMessage ? (
              <span className="text-xs text-teal-400 font-medium">
                {feedbackMessage}
              </span>
            ) : (
              <span className="text-xs text-charcoal-400">
                Adds entry to your personal local {item.mediaType === "movie" ? "Movie Tracker" : "Series Tracker"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleAdd}
              disabled={isInWatchlist || isAdding}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isInWatchlist
                  ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 cursor-default"
                  : "bg-teal-500 hover:bg-teal-400 text-charcoal-950 shadow-md shadow-teal-500/20"
              }`}
            >
              {isInWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isAdding ? "Adding..." : "Add to Watchlist"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
