/**
 * Sprint Burndown Chart Component
 *
 * Visual burndown chart showing sprint progress over time
 */

import { TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "../../ui/primitives/styles";

interface BurndownSnapshot {
  snapshot_date: string;
  remaining_tasks: number;
  remaining_story_points: number;
  completed_today_tasks: number;
}

interface IdealLinePoint {
  day: number;
  ideal_remaining: number;
}

interface SprintBurndownChartProps {
  snapshots: BurndownSnapshot[];
  idealLine: IdealLinePoint[];
  sprintName: string;
  className?: string;
}

export function SprintBurndownChart({
  snapshots,
  idealLine,
  sprintName,
  className,
}: SprintBurndownChartProps) {
  // Combine snapshots with ideal line for chart
  const chartData = snapshots.map((snapshot, index) => ({
    day: index,
    date: new Date(snapshot.snapshot_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    actual: snapshot.remaining_tasks,
    ideal: idealLine[index]?.ideal_remaining || 0,
  }));

  // Extend with future ideal line if sprint is ongoing
  if (chartData.length < idealLine.length) {
    for (let i = chartData.length; i < idealLine.length; i++) {
      chartData.push({
        day: i,
        date: `Day ${i + 1}`,
        actual: null as any,
        ideal: idealLine[i].ideal_remaining,
      });
    }
  }

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.actual || 0, d.ideal || 0)),
    10 // Minimum scale
  );

  return (
    <div
      className={cn(
        "p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-[#C0745F] dark:text-[#D4917A]" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Sprint Burndown</h3>
        <span className="text-sm text-gray-500">({sprintName})</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C0745F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C0745F" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />

          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, maxValue]}
            label={{
              value: "Remaining Tasks",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: "#64748b" },
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />

          {/* Ideal line (dashed) */}
          <Area
            type="monotone"
            dataKey="ideal"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorIdeal)"
            name="Ideal"
          />

          {/* Actual line (solid) */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#C0745F"
            strokeWidth={3}
            fill="url(#colorActual)"
            name="Actual"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-[#C0745F]" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400 border-t-2 border-dashed border-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Ideal</span>
        </div>
      </div>
    </div>
  );
}
