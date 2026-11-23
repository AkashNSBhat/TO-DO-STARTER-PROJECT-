import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Film,
  Tv,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { TMDBImporter, ImportProgress } from "../../lib/catalog/importer";
import { CatalogueDatabase, CatalogueStats } from "../../lib/catalog/database";
import { CatalogueClient } from "../../lib/catalog/client";

interface CatalogueManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogueUpdated?: () => void;
}

const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English (Franchises & Hits)" },
  { code: "hi", label: "Hindi (हिंदी — Hits & Classics)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "ko", label: "Korean (한국어)" },
  { code: "ja", label: "Japanese (Anime/Cinema)" },
  { code: "th", label: "Thai (ไทย)" },
  { code: "es", label: "Spanish" },
];

export const CatalogueManagerModal: React.FC<CatalogueManagerModalProps> = ({
  isOpen,
  onClose,
  onCatalogueUpdated,
}) => {
  const [stats, setStats] = useState<CatalogueStats>(CatalogueDatabase.getStats());
  const [importer] = useState<TMDBImporter>(() => new TMDBImporter());
  const [progress, setProgress] = useState<ImportProgress>(importer.getProgress());
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "en",
    "hi",
    "kn",
  ]);
  const [targetPerLanguage, setTargetPerLanguage] = useState<number>(25);
  const [includeEpisodes, setIncludeEpisodes] = useState<boolean>(true);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setStats(CatalogueDatabase.getStats());
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = importer.onProgress((p) => {
      setProgress(p);
      if (p.status === "completed" || p.moviesImported > 0 || p.seriesImported > 0) {
        setStats(CatalogueDatabase.getStats());
        onCatalogueUpdated?.();
      }
    });
    return () => unsubscribe();
  }, [importer, onCatalogueUpdated]);

  if (!isOpen) return null;

  const hasApiKey = CatalogueClient.hasTmdbApiKey();

  const handleToggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== code));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleStartImport = () => {
    importer.runImport({
      languages: selectedLanguages,
      targetMoviesPerLanguage: targetPerLanguage,
      targetSeriesPerLanguage: targetPerLanguage,
      includeSeasonsAndEpisodes: includeEpisodes,
    });
  };

  const handlePauseResume = () => {
    if (importer.isPaused()) {
      importer.resume();
    } else {
      importer.pause();
    }
  };

  const handleCancelImport = () => {
    importer.cancel();
  };

  const handleResetCatalogue = () => {
    CatalogueDatabase.reset();
    setStats(CatalogueDatabase.getStats());
    setConfirmReset(false);
    onCatalogueUpdated?.();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isRunning = progress.status === "running";
  const isPaused = progress.status === "paused";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] bg-charcoal-900 border border-charcoal-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-800 bg-charcoal-900/90 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-100 flex items-center gap-2">
                <span>Catalogue Manager</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Offline SQLite Pack
                </span>
              </h2>
              <p className="text-xs text-charcoal-400">
                Manage local media database volume, TMDB sync, and season/episode records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-charcoal-950/70 border border-charcoal-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                <Film className="w-3.5 h-3.5 text-teal-400" />
                <span>Movies</span>
              </div>
              <span className="text-lg font-bold text-charcoal-50 font-mono">
                {stats.totalMovies.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-950/70 border border-charcoal-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                <Tv className="w-3.5 h-3.5 text-indigo-400" />
                <span>Series</span>
              </div>
              <span className="text-lg font-bold text-charcoal-50 font-mono">
                {stats.totalSeries.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-950/70 border border-charcoal-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Seasons & Eps</span>
              </div>
              <span className="text-xs font-semibold text-charcoal-200 font-mono pt-1">
                {stats.totalSeasons.toLocaleString()} S • {stats.totalEpisodes.toLocaleString()} Eps
              </span>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-950/70 border border-charcoal-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Storage Size</span>
              </div>
              <span className="text-sm font-bold text-charcoal-200 font-mono pt-0.5">
                {formatBytes(stats.databaseSizeBytes)}
              </span>
            </div>
          </div>

          {/* TMDB API Key Connection Status */}
          <div className="p-3.5 rounded-xl bg-charcoal-950/50 border border-charcoal-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {hasApiKey ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="font-semibold text-charcoal-200">
                  {hasApiKey
                    ? "TMDB Provider Active (Live Discovery Enabled)"
                    : "No TMDB API Key Configured"}
                </p>
                <p className="text-[11px] text-charcoal-500">
                  {hasApiKey
                    ? "Ready to import live movie & TV metadata across languages"
                    : "Configure in Settings to enable real-time batch imports"}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                hasApiKey
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {hasApiKey ? "Connected" : "Offline Only"}
            </span>
          </div>

          {/* Baseline pack notice */}
          {stats.totalMovies <= 150 && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center justify-between">
              <span>
                💡 Currently loaded with the <strong>130 base pack</strong>. Select a preset below and click <strong>Start Importer</strong> to expand to 5,000+ movies & series!
              </span>
            </div>
          )}

          {/* Import Configuration Panel */}
          <div className="space-y-3.5 p-4 rounded-xl bg-charcoal-950/70 border border-charcoal-800">
            <h3 className="text-xs font-bold text-charcoal-200 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Real TMDB Importer Controls</span>
            </h3>

            {/* Presets & Language Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="block text-xs font-medium text-charcoal-400">
                  Target Languages for Import:
                </label>
                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguages(["en", "hi", "kn"]);
                      setTargetPerLanguage(1700);
                    }}
                    disabled={isRunning}
                    className="px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-semibold cursor-pointer transition-colors"
                  >
                    ⭐ Core Focus: EN + HI + KN (5,100+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguages(["ta", "te", "ml", "ko", "ja", "th", "es"]);
                      setTargetPerLanguage(25);
                    }}
                    disabled={isRunning}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold cursor-pointer transition-colors"
                  >
                    🌏 Top 25 Showcase (Regional & Asian)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguages(AVAILABLE_LANGUAGES.map((l) => l.code));
                      setTargetPerLanguage(500);
                    }}
                    disabled={isRunning}
                    className="px-2 py-0.5 rounded bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 cursor-pointer"
                  >
                    Select All (10)
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleToggleLanguage(lang.code)}
                      disabled={isRunning}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-teal-500 text-charcoal-950 font-semibold shadow-sm"
                          : "bg-charcoal-800 text-charcoal-400 hover:text-charcoal-200"
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Volume Per Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-charcoal-400 mb-1">
                  Target Per Language (Movies & Series):
                </label>
                <select
                  value={targetPerLanguage}
                  onChange={(e) => setTargetPerLanguage(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value={20}>20 each (Curated Top 20 Showcase)</option>
                  <option value={25}>25 each (Curated Top 25 Showcase)</option>
                  <option value={50}>50 each (Balanced — ~500 items)</option>
                  <option value={100}>100 each (Substantial — ~1,000 items)</option>
                  <option value={250}>250 each (Deep Catalogue — ~2,500 items)</option>
                  <option value={500}>500 each (Large Catalogue — ~5,000 items)</option>
                  <option value={1700}>1,700 each (⭐ 5,100 Movies + 5,100 Series across EN, HI, KN)</option>
                  <option value={2500}>2,500 each (Massive Catalogue — ~25,000 items)</option>
                  <option value={5000}>5,000 each (Maximum Volume — ~50,000 items)</option>
                </select>
                <div className="mt-1 text-[11px] text-teal-400/90 font-medium">
                  Estimated Run: {selectedLanguages.length * targetPerLanguage} Movies + {selectedLanguages.length * targetPerLanguage} Series across {selectedLanguages.length} language(s)
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-400 mb-1">
                  Seasons & Episodes Policy:
                </label>
                <label className="flex items-center gap-2 pt-1 text-xs text-charcoal-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEpisodes}
                    onChange={(e) => setIncludeEpisodes(e.target.checked)}
                    disabled={isRunning}
                    className="rounded border-charcoal-700 text-teal-500 focus:ring-0 bg-charcoal-900"
                  />
                  <span>Fetch seasons & generate episode checklists</span>
                </label>
              </div>
            </div>

            {/* Live Progress Bar if Running, Paused, or Completed */}
            {progress.status !== "idle" && (
              <div className="pt-2 space-y-2 border-t border-charcoal-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-200 flex items-center gap-1.5">
                    {progress.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : progress.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                    )}
                    <span>{progress.currentPhase}</span>
                  </span>
                  <span className="font-mono text-teal-400 font-bold">
                    {progress.percent}%
                  </span>
                </div>

                {/* Progress Track */}
                <div className="h-2 w-full bg-charcoal-900 rounded-full overflow-hidden border border-charcoal-700/50">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress.status === "completed"
                        ? "bg-emerald-500"
                        : progress.status === "error"
                        ? "bg-rose-500"
                        : "bg-teal-500"
                    }`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                {/* Stats Breakdown Row */}
                <div className="flex items-center justify-between text-[11px] text-charcoal-400 font-mono pt-1">
                  <span>
                    Imported: <strong className="text-charcoal-200">{progress.moviesImported} Movies</strong> •{" "}
                    <strong className="text-charcoal-200">{progress.seriesImported} Series</strong>
                  </span>
                  <span>
                    Skipped: {progress.skippedDuplicates} • Failed: {progress.failedCount}
                  </span>
                </div>

                {progress.errorMessage && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {progress.errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* Importer Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              {!isRunning && !isPaused ? (
                <button
                  onClick={handleStartImport}
                  disabled={!hasApiKey}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-charcoal-950 font-bold text-xs transition-colors shadow-md shadow-teal-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start TMDB Live Import</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? "Resume Import" : "Pause Import"}</span>
                  </button>

                  <button
                    onClick={handleCancelImport}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reset / Clean Options */}
          <div className="p-3.5 rounded-xl bg-charcoal-950/40 border border-charcoal-800 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-charcoal-300">Reset Local Catalogue</p>
              <p className="text-[11px] text-charcoal-500">
                Restores the offline database back to its curated base pack.
              </p>
            </div>

            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCatalogue}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1.5 rounded-lg bg-charcoal-800 text-charcoal-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                disabled={isRunning}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset to Base</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-charcoal-800 bg-charcoal-900/90 z-10 text-xs">
          <span className="text-[11px] text-charcoal-500">
            Last Updated: {new Date(stats.lastImportedAt).toLocaleDateString()}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
