import React, { useState, useEffect } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";

interface PlannerItem {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyPlannerData {
  scheduleItems: PlannerItem[];
  topPriorities: PlannerItem[];
  forTomorrow: PlannerItem[];
  dontForget: PlannerItem[];
  notes: string;
  selectedDay: string; // "M" | "T" | "W" | "TH" | "F" | "SA" | "SU"
}

const PASTEL_BOX_COLORS = [
  "border-[#f472b6] bg-[#fdf2f8] text-[#db2777] dark:bg-pink-950/40 dark:border-pink-500/60", // pink
  "border-[#38bdf8] bg-[#f0f9ff] text-[#0284c7] dark:bg-sky-950/40 dark:border-sky-500/60",   // blue
  "border-[#fb923c] bg-[#fff7ed] text-[#ea580c] dark:bg-orange-950/40 dark:border-orange-500/60", // peach
  "border-[#facc15] bg-[#fefce8] text-[#ca8a04] dark:bg-amber-950/40 dark:border-amber-500/60", // yellow
  "border-[#94a3b8] bg-[#f8fafc] text-[#475569] dark:bg-slate-800/60 dark:border-slate-500/60", // grey
];

const DAYS_OF_WEEK = ["M", "T", "W", "TH", "F", "SA", "SU"];

const DEFAULT_PLANNER_DATA: DailyPlannerData = {
  selectedDay: "W",
  scheduleItems: [
    { id: "1", text: "Morning review & standup focus", completed: true },
    { id: "2", text: "09:00 - Deep work: Core feature implementation", completed: true },
    { id: "3", text: "11:30 - Review PRs & code polish", completed: false },
    { id: "4", text: "13:00 - Lunch break & walk outside", completed: true },
    { id: "5", text: "14:00 - UI / UX design refinement", completed: false },
    { id: "6", text: "15:30 - Database optimization & tests", completed: false },
    { id: "7", text: "17:00 - Daily retrospective & sync", completed: false },
    { id: "8", text: "18:00 - Movie or reading session", completed: false },
    { id: "9", text: "", completed: false },
    { id: "10", text: "", completed: false },
    { id: "11", text: "", completed: false },
    { id: "12", text: "", completed: false },
    { id: "13", text: "", completed: false },
    { id: "14", text: "", completed: false },
  ],
  topPriorities: [
    { id: "p1", text: "Deliver Daily Planner visual experience", completed: true },
    { id: "p2", text: "Pass all 95 automated test suites", completed: true },
    { id: "p3", text: "Verify high-contrast light and dark themes", completed: false },
  ],
  forTomorrow: [
    { id: "t1", text: "Review offline synchronization flow", completed: false },
    { id: "t2", text: "Clean up unused CSS utilities", completed: false },
    { id: "t3", text: "Prepare build release bundle", completed: false },
  ],
  dontForget: [
    { id: "df1", text: "Backup SQLite database snapshot", completed: false },
    { id: "df2", text: "Update changelog with design overhaul", completed: false },
    { id: "df3", text: "Stay hydrated & take regular breaks", completed: true },
  ],
  notes: "Ideas for the next release:\n• Keyboard shortcuts for quick check-off\n• Export planner sheet to clean printable PDF",
};

const STORAGE_KEY = "daymark_daily_paper_planner_data_v1";

export const DailyPaperPlanner: React.FC = () => {
  const [data, setData] = useState<DailyPlannerData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PLANNER_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or error
    }
  }, [data]);

  // Toggle Schedule Item
  const toggleScheduleItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  // Update Schedule Item Text
  const updateScheduleItemText = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  // Toggle Priority Item
  const togglePriority = (id: string) => {
    setData((prev) => ({
      ...prev,
      topPriorities: prev.topPriorities.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const updatePriorityText = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      topPriorities: prev.topPriorities.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  // Toggle For Tomorrow Item
  const toggleTomorrow = (id: string) => {
    setData((prev) => ({
      ...prev,
      forTomorrow: prev.forTomorrow.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const updateTomorrowText = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      forTomorrow: prev.forTomorrow.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  // Toggle Don't Forget Item
  const toggleDontForget = (id: string) => {
    setData((prev) => ({
      ...prev,
      dontForget: prev.dontForget.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const updateDontForgetText = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      dontForget: prev.dontForget.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  // Reset to default sample
  const handleReset = () => {
    if (window.confirm("Reset Daily Planner to clean sample template?")) {
      setData(DEFAULT_PLANNER_DATA);
    }
  };

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date("2026-11-18"));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Paper Notepad Sheet Container */}
      <div className="bg-[#ffffff] dark:bg-[#181a20] text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-[#2b2e38] p-5 sm:p-8 transition-colors relative overflow-hidden font-sans">
        
        {/* Subtle Sheet Background Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-400 via-amber-300 via-emerald-400 to-sky-400 opacity-80" />

        {/* Top Controls Toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Paper Planner</span>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset template"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sheet</span>
          </button>
        </div>

        {/* Main Title: EXACTLY as in the Reference Picture */}
        <div className="text-center pb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#2f3542] dark:text-slate-100 uppercase">
            DAILY PLANNER
          </h2>
          <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto mt-2 rounded-full" />
        </div>

        {/* 2-Column Split: Left Checklist & Right Pastel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Ruled Lined Checklist with Pastel Boxes     */}
          {/* ======================================================== */}
          <div className="md:col-span-7 flex flex-col space-y-0 border-r border-transparent md:border-slate-100 md:dark:border-slate-800 md:pr-4">
            {data.scheduleItems.map((item, index) => {
              const colorClass = PASTEL_BOX_COLORS[index % PASTEL_BOX_COLORS.length];

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 border-b border-dashed border-slate-200 dark:border-slate-800/80 group min-h-[38px] transition-colors"
                >
                  {/* Pastel Checkbox Box */}
                  <button
                    type="button"
                    onClick={() => toggleScheduleItem(item.id)}
                    className={cn(
                      "w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 cursor-pointer transition-all",
                      colorClass,
                      item.completed && "opacity-90 ring-1 ring-emerald-500/30"
                    )}
                    title={item.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {item.completed && (
                      <Check className="w-3 h-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>

                  {/* Lined Text / Inline Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.text}
                      placeholder={index < 8 ? "Type scheduled item..." : ""}
                      onChange={(e) => updateScheduleItemText(item.id, e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-none p-0 text-xs sm:text-sm focus:outline-none focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-700",
                        item.completed
                          ? "line-through text-slate-400 dark:text-slate-500 font-normal"
                          : "text-slate-700 dark:text-slate-200 font-medium"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: 4 Signature Pastel Section Cards           */}
          {/* ======================================================== */}
          <div className="md:col-span-5 space-y-4">
            
            {/* 1. DATE BANNER & DAY SELECTOR */}
            <div className="space-y-2">
              {/* Pink Pill Header */}
              <div className="bg-[#fbcfe8] dark:bg-[#4a1d36] text-[#831843] dark:text-[#fbcfe8] px-3.5 py-1.5 rounded-xl font-bold tracking-wider text-xs flex items-center justify-between shadow-xs">
                <span>DATE</span>
                <span className="font-mono text-[11px] font-semibold opacity-90">{todayFormatted}</span>
              </div>

              {/* Day of Week Selector: M T W TH F SA SU */}
              <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = data.selectedDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, selectedDay: day }))}
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer",
                        isSelected
                          ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs scale-105"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TOP PRIORITIES (Pastel Yellow Card) */}
            <div className="bg-[#fef9c3] dark:bg-[#2b2713] text-[#713f12] dark:text-[#fef08a] border border-[#fef08a]/80 dark:border-[#713f12]/60 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider uppercase flex items-center justify-between">
                <span>TOP PRIORITIES</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {data.topPriorities.filter((i) => i.completed).length}/{data.topPriorities.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {data.topPriorities.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-0.5 border-b border-dashed border-[#eab308]/40 dark:border-[#eab308]/20">
                    <button
                      type="button"
                      onClick={() => togglePriority(item.id)}
                      className={cn(
                        "w-3.5 h-3.5 rounded-[3px] border border-[#ca8a04] dark:border-[#facc15] flex items-center justify-center bg-white/60 dark:bg-black/20 shrink-0 cursor-pointer",
                        item.completed && "bg-[#ca8a04] text-white dark:bg-[#facc15] dark:text-black"
                      )}
                    >
                      {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      placeholder="Add priority..."
                      onChange={(e) => updatePriorityText(item.id, e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 placeholder:text-amber-700/40 dark:placeholder:text-amber-300/30",
                        item.completed
                          ? "line-through opacity-60 font-normal"
                          : "font-medium text-[#713f12] dark:text-[#fef08a]"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FOR TOMORROW (Pastel Sage/Green Card) */}
            <div className="bg-[#dcfce7] dark:bg-[#122b1c] text-[#14532d] dark:text-[#bbf7d0] border border-[#bbf7d0]/80 dark:border-[#14532d]/60 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider uppercase flex items-center justify-between">
                <span>FOR TOMORROW</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {data.forTomorrow.filter((i) => i.completed).length}/{data.forTomorrow.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {data.forTomorrow.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-0.5 border-b border-dashed border-[#22c55e]/40 dark:border-[#22c55e]/20">
                    <button
                      type="button"
                      onClick={() => toggleTomorrow(item.id)}
                      className={cn(
                        "w-3.5 h-3.5 rounded-[3px] border border-[#16a34a] dark:border-[#4ade80] flex items-center justify-center bg-white/60 dark:bg-black/20 shrink-0 cursor-pointer",
                        item.completed && "bg-[#16a34a] text-white dark:bg-[#4ade80] dark:text-black"
                      )}
                    >
                      {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      placeholder="Add item for tomorrow..."
                      onChange={(e) => updateTomorrowText(item.id, e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 placeholder:text-emerald-700/40 dark:placeholder:text-emerald-300/30",
                        item.completed
                          ? "line-through opacity-60 font-normal"
                          : "font-medium text-[#14532d] dark:text-[#bbf7d0]"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. DON'T FORGET (Pastel Peach/Coral Card) */}
            <div className="bg-[#ffedd5] dark:bg-[#331c13] text-[#7c2d12] dark:text-[#fed7aa] border border-[#fed7aa]/80 dark:border-[#7c2d12]/60 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider uppercase flex items-center justify-between">
                <span>DON'T FORGET</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {data.dontForget.filter((i) => i.completed).length}/{data.dontForget.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {data.dontForget.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-0.5 border-b border-dashed border-[#ea580c]/40 dark:border-[#ea580c]/20">
                    <button
                      type="button"
                      onClick={() => toggleDontForget(item.id)}
                      className={cn(
                        "w-3.5 h-3.5 rounded-[3px] border border-[#ea580c] dark:border-[#fb923c] flex items-center justify-center bg-white/60 dark:bg-black/20 shrink-0 cursor-pointer",
                        item.completed && "bg-[#ea580c] text-white dark:bg-[#fb923c] dark:text-black"
                      )}
                    >
                      {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      placeholder="Add reminder..."
                      onChange={(e) => updateDontForgetText(item.id, e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 placeholder:text-orange-700/40 dark:placeholder:text-orange-300/30",
                        item.completed
                          ? "line-through opacity-60 font-normal"
                          : "font-medium text-[#7c2d12] dark:text-[#fed7aa]"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. NOTES (Pastel Sky Blue Card) */}
            <div className="bg-[#e0f2fe] dark:bg-[#122638] text-[#075985] dark:text-[#bae6fd] border border-[#bae6fd]/80 dark:border-[#075985]/60 rounded-2xl p-3.5 space-y-2 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider uppercase">
                <span>NOTES</span>
              </div>
              <textarea
                value={data.notes}
                rows={4}
                placeholder="Write freeform notes, phone numbers, ideas..."
                onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-transparent border-none p-0 text-xs focus:outline-none focus:ring-0 resize-none font-sans leading-relaxed text-[#075985] dark:text-[#bae6fd] placeholder:text-sky-700/40 dark:placeholder:text-sky-300/30"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
