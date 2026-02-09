import type React from "react";
import { cn } from "./styles";

export type PillColor = "blue" | "orange" | "cyan" | "purple" | "pink" | "green" | "gray";

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: PillColor;
  value: number | string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

// Static maps hoisted outside component to avoid re-allocation on each render
const SIZE_MAP = {
  sm: "h-6 px-2 text-[11px] gap-1",
  md: "h-7 px-2.5 text-xs gap-1.5",
} as const;

const COLOR_MAP: Record<PillColor, { bg: string; text: string; border: string; glow: string }> = {
  blue: {
    bg: "from-[#5B8C5A]/15 to-white/60 dark:from-[#5B8C5A]/20 dark:to-[#5B8C5A]/10",
    text: "text-[#5B8C5A] dark:text-[#7DAC7C]",
    border: "border-[#5B8C5A]/40 dark:border-[#5B8C5A]/40",
    glow: "",
  },
  orange: {
    bg: "from-orange-100/80 to-white/60 dark:from-orange-500/20 dark:to-orange-500/10",
    text: "text-orange-700 dark:text-orange-200",
    border: "border-orange-300/60 dark:border-orange-500/50",
    glow: "",
  },
  cyan: {
    bg: "from-[#C0745F]/15 to-white/60 dark:from-[#C0745F]/20 dark:to-[#C0745F]/10",
    text: "text-[#C0745F] dark:text-[#D4907D]",
    border: "border-[#C0745F]/40 dark:border-[#C0745F]/40",
    glow: "",
  },
  purple: {
    bg: "from-amber-100/80 to-white/60 dark:from-amber-500/20 dark:to-amber-500/10",
    text: "text-amber-700 dark:text-amber-200",
    border: "border-amber-300/60 dark:border-amber-500/50",
    glow: "",
  },
  pink: {
    bg: "from-[#C0745F]/15 to-white/60 dark:from-[#C0745F]/20 dark:to-[#C0745F]/10",
    text: "text-[#C0745F] dark:text-[#D4907D]",
    border: "border-[#C0745F]/40 dark:border-[#C0745F]/40",
    glow: "",
  },
  green: {
    bg: "from-green-100/80 to-white/60 dark:from-green-500/20 dark:to-green-500/10",
    text: "text-green-700 dark:text-green-200",
    border: "border-green-300/60 dark:border-green-500/50",
    glow: "",
  },
  gray: {
    bg: "from-gray-100/80 to-white/60 dark:from-gray-500/20 dark:to-gray-500/10",
    text: "text-gray-700 dark:text-gray-200",
    border: "border-gray-300/60 dark:border-gray-500/50",
    glow: "",
  },
};

/**
 * StatPill -- rounded glass/stat indicator with warm accents.
 * Used for compact counters inside cards (docs, examples, etc.).
 */
export const StatPill: React.FC<StatPillProps> = ({
  color = "blue",
  value,
  icon,
  size = "sm",
  className,
  ...props
}) => {
  const c = COLOR_MAP[color];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full backdrop-blur-md border",
        "bg-gradient-to-b",
        c.bg,
        c.text,
        c.border,
        c.glow,
        SIZE_MAP[size],
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="inline-flex items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
};
