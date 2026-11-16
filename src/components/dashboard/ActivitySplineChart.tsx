import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Activity } from "lucide-react";
import { Card } from "../common/Card";

export interface ActivitySplinePoint {
  date: string;
  completions: number;
}

export interface ActivitySplineChartProps {
  data: ActivitySplinePoint[];
}

export const ActivitySplineChart: React.FC<ActivitySplineChartProps> = ({ data }) => {
  const totalCompletions = data.reduce((acc, curr) => acc + curr.completions, 0);

  return (
    <Card
      title="Activity Velocity"
      subtitle={`Daily task and milestone completions (${totalCompletions} total in 14-day window)`}
      action={
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
          <Activity className="w-4 h-4" />
        </div>
      }
    >
      <div className="w-full h-56 min-h-[220px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="dashboardActivitySplineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle, #2b323d)"
              vertical={false}
              opacity={0.4}
            />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle, #2b323d)" }}
              tickFormatter={(val: string) => {
                const parts = val.split("-");
                if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                return val;
              }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border-subtle, #2b323d)" }}
              allowDecimals={false}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-600 px-3 py-2 text-xs shadow-xl">
                      <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                        Date: {label}
                      </p>
                      <p className="text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                        {payload[0].value} {payload[0].value === 1 ? "completion" : "completions"}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="completions"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dashboardActivitySplineGrad)"
              dot={{ r: 2.5, fill: "#14b8a6", stroke: "#121417", strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#121417", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
