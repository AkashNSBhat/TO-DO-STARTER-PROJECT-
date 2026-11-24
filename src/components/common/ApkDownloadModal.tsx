import React from "react";
import { Download, Smartphone, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const apkDownloadUrl = "/downloads/daymark-mobile-preview.apk";
  const githubMirrorUrl = "https://raw.githubusercontent.com/AkashNSBhat/TO-DO-STARTER-PROJECT-/main/public/downloads/daymark-mobile-preview.apk";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download DAYMARK Mobile (Android APK)"
      description="Preview the responsive mobile companion app on your Android device."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            v0.1.0 &bull; Universal APK (3.75 MB)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <a
              href={githubMirrorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-charcoal-700 dark:hover:bg-charcoal-600 text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub Mirror</span>
            </a>
            <a
              href={apkDownloadUrl}
              download="daymark-mobile-preview.apk"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Hero Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                DAYMARK Mobile Companion (APK)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Ready for Testing
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Experience the touch-optimized mobile layout with offline SQLite sync, quick tasks capture, and entertainment tracking on the go.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Responsive Touch UI</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Mobile bottom dock & off-canvas drawer</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Offline Local Database</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">100% private SQLite data ownership</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">4-Tile Horizon Matrix</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Weekly, monthly, and yearly goals</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Universal Android Support</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">ARM64, ARMv7, x86_64 compatible</span>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-charcoal-900/60 border border-slate-200/80 dark:border-charcoal-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>How to Install on Android</span>
          </div>
          <ol className="list-decimal list-inside text-[11px] space-y-0.5 pt-0.5 pl-1">
            <li>Download the <code className="text-blue-500 font-mono">daymark-mobile-preview.apk</code> file.</li>
            <li>Open the file on your device and tap <strong>Install</strong>.</li>
            <li>Enable <em>"Install unknown apps"</em> if prompted by your browser or files app.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
