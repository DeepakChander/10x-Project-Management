/**
 * Velocity Chart Component
 *
 * Shows team velocity trend over multiple sprints
 */

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "../../ui/primitives/styles";

interface VelocityData {
  sprint_name: string;
  velocity_points: number;
  planned_story_points: number;
  completed_story_points: number;
  completion_rate: number;
}

interface VelocityChartProps {
  velocityData: VelocityData[];
  avgVelocity: number;
  className?: string;
}

export function VelocityChart({ velocityData, avgVelocity, className }: VelocityChartProps) {
  // Format data for chart
  const chartData = velocityData.map((v) => ({
    sprint: v.sprint_name.replace("Sprint ", "S"),
    velocity: v.velocity_points || 0,
    planned: v.planned_story_points || 0,
    average: avgVelocity,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#C0745F] dark:text-[#D4917A]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Team Velocity</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          Complete your first sprint to see velocity trends
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-800/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#C0745F] dark:text-[#D4917A]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Team Velocity</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Average Velocity</div>
          <div className="text-2xl font-bold text-[#C0745F] dark:text-[#D4917A]">
            {avgVelocity.toFixed(1)} <span className="text-sm font-normal text-gray-500">pts</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />

          <XAxis
            dataKey="sprint"
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
            label={{
              value: "Story Points",
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

          {/* Planned (light bar) */}
          <Bar dataKey="planned" fill="#e2e8f0" name="Planned" radius={[4, 4, 0, 0]} />

          {/* Completed (colored bar) */}
          <Bar dataKey="velocity" fill="#C0745F" name="Completed" radius={[4, 4, 0, 0]} />

          {/* Average line */}
          <Line
            type="monotone"
            dataKey="average"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Average"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-[#C0745F] rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-gray-200 rounded" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500 border-t-2 border-dashed border-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Average</span>
        </div>
      </div>
    </div>
  );
}
