import React, { useState, useEffect } from "react";
import { Star, Check, Plus, Film, Tv, Globe } from "lucide-react";
import { MediaCatalogItem } from "../../lib/catalog/types";
import { CatalogueClient } from "../../lib/catalog/client";

interface DiscoverCardProps {
  item: MediaCatalogItem;
  onSelect: (item: MediaCatalogItem) => void;
  onWatchlistChanged?: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
  de: "German",
  es: "Spanish",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  it: "Italian",
};

export const DiscoverCard: React.FC<DiscoverCardProps> = ({
  item,
  onSelect,
  onWatchlistChanged,
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
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
  }, [item.primaryTitle, item.releaseYear, item.mediaType]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWatchlist || isAdding) return;

    setIsAdding(true);
    const result = await CatalogueClient.addToWatchlist(item);
    setIsAdding(false);

    if (result.success || result.alreadyExisted) {
      setIsInWatchlist(true);
      onWatchlistChanged?.();
    }
  };

  const originalLangName =
    LANGUAGE_LABELS[item.originalLanguage.toLowerCase()] ||
    item.originalLanguage.toUpperCase();

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-xl bg-charcoal-900/60 border border-charcoal-800/80 hover:border-teal-500/50 hover:bg-charcoal-850/80 transition-all duration-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:shadow-teal-950/20"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-charcoal-950 overflow-hidden">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.primaryTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder visual on image load failure
              (e.currentTarget as HTMLElement).style.display = "none";
            }}
          />
        ) : null}

        {/* Fallback Graphic if no image or error */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-charcoal-900 to-charcoal-950 -z-0">
          {item.mediaType === "movie" ? (
            <Film className="w-12 h-12 text-charcoal-700 mb-2" />
          ) : (
            <Tv className="w-12 h-12 text-charcoal-700 mb-2" />
          )}
          <span className="text-xs font-medium text-charcoal-400 line-clamp-2">
            {item.primaryTitle}
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Media Type Pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-charcoal-950/80 backdrop-blur-md text-charcoal-200 border border-charcoal-700/60 shadow">
            {item.mediaType === "movie" ? (
              <Film className="w-2.5 h-2.5 text-teal-400" />
            ) : (
              <Tv className="w-2.5 h-2.5 text-indigo-400" />
            )}
            {item.mediaType === "movie" ? "Movie" : `${item.totalSeasons || 1}S`}
          </span>

          {/* Rating Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-charcoal-950/85 backdrop-blur-md text-amber-400 border border-amber-500/30 shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {item.rating.toFixed(1)}
          </span>
        </div>

        {/* Bottom Poster Gradient & Language Pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-charcoal-950/80 backdrop-blur-md text-teal-300 border border-teal-500/20">
            <Globe className="w-2.5 h-2.5" />
            {originalLangName}
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {/* Title & Release Year */}
        <div>
          <div className="flex items-baseline justify-between gap-1">
            <h3 className="font-semibold text-sm text-charcoal-100 group-hover:text-teal-400 transition-colors line-clamp-1">
              {item.primaryTitle}
            </h3>
            <span className="text-xs text-charcoal-400 shrink-0 font-medium">
              {item.releaseYear}
            </span>
          </div>

          {/* Original / Alternate Title Subtitle if different */}
          {item.originalTitle !== item.primaryTitle && (
            <p className="text-[11px] text-charcoal-400 line-clamp-1 italic mt-0.5">
              Orig: {item.originalTitle}
            </p>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {item.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700/50"
            >
              {genre}
            </span>
          ))}
          {item.genres.length > 2 && (
            <span className="text-[10px] text-charcoal-500 self-center">
              +{item.genres.length - 2}
            </span>
          )}
        </div>

        {/* Action Button: Add to Watchlist */}
        <button
          onClick={handleQuickAdd}
          disabled={isInWatchlist || isAdding}
          className={`w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            isInWatchlist
              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 cursor-default"
              : "bg-charcoal-800 hover:bg-teal-500 hover:text-charcoal-950 text-charcoal-200 border border-charcoal-700"
          }`}
          title={
            isInWatchlist
              ? "Already in Watchlist"
              : `Add "${item.primaryTitle}" to Watchlist`
          }
        >
          {isInWatchlist ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span>In Watchlist</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? "Adding..." : "Add to Watchlist"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
