import * as CheckboxPrimitives from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import * as React from "react";
import { cn, glassmorphism } from "./styles";

export type CheckboxColor = "purple" | "blue" | "green" | "pink" | "orange" | "cyan";

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitives.Root> {
  color?: CheckboxColor;
  indeterminate?: boolean;
}

const checkboxVariants = {
  purple: {
    checked: "data-[state=checked]:bg-amber-500/20 data-[state=checked]:border-amber-500",
    glow: "",
    indicator: "text-amber-500",
    focusRing: "focus-visible:ring-amber-500",
  },
  blue: {
    checked: "data-[state=checked]:bg-[#5B8C5A]/20 data-[state=checked]:border-[#5B8C5A]",
    glow: "",
    indicator: "text-[#5B8C5A]",
    focusRing: "focus-visible:ring-[#5B8C5A]",
  },
  green: {
    checked: "data-[state=checked]:bg-green-500/20 data-[state=checked]:border-green-500",
    glow: "",
    indicator: "text-green-500",
    focusRing: "focus-visible:ring-green-500",
  },
  pink: {
    checked: "data-[state=checked]:bg-[#C0745F]/20 data-[state=checked]:border-[#C0745F]",
    glow: "",
    indicator: "text-[#C0745F]",
    focusRing: "focus-visible:ring-[#C0745F]",
  },
  orange: {
    checked: "data-[state=checked]:bg-orange-500/20 data-[state=checked]:border-orange-500",
    glow: "",
    indicator: "text-orange-500",
    focusRing: "focus-visible:ring-orange-500",
  },
  cyan: {
    checked: "data-[state=checked]:bg-[#C0745F]/20 data-[state=checked]:border-[#C0745F]",
    glow: "",
    indicator: "text-[#C0745F]",
    focusRing: "focus-visible:ring-[#C0745F]",
  },
};

/**
 * Glassmorphic Checkbox Component with warm color accents.
 * Supports checked, unchecked, and indeterminate states with smooth transitions.
 */
const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitives.Root>, CheckboxProps>(
  ({ className, color = "cyan", indeterminate, checked, ...props }, ref) => {
    const colorStyles = checkboxVariants[color];

    return (
      <CheckboxPrimitives.Root
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-md",
          "bg-black/10 dark:bg-white/10 backdrop-blur-xl",
          "border-2 border-gray-300/30 dark:border-white/10",
          "transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          colorStyles.focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-gray-400/50 dark:hover:border-white/20",
          colorStyles.checked,
          colorStyles.glow,
          "data-[state=indeterminate]:bg-opacity-50",
          glassmorphism.interactive.base,
          className,
        )}
        checked={indeterminate ? "indeterminate" : checked}
        {...props}
        ref={ref}
      >
        <CheckboxPrimitives.Indicator
          className={cn(
            "flex items-center justify-center",
            "data-[state=checked]:animate-in data-[state=checked]:zoom-in-0",
            "data-[state=unchecked]:animate-out data-[state=unchecked]:zoom-out-0",
            "data-[state=indeterminate]:animate-in data-[state=indeterminate]:zoom-in-0",
          )}
        >
          {indeterminate ? (
            <Minus className={cn("h-3.5 w-3.5", colorStyles.indicator)} />
          ) : (
            <Check className={cn("h-4 w-4", colorStyles.indicator)} />
          )}
        </CheckboxPrimitives.Indicator>
      </CheckboxPrimitives.Root>
    );
  },
);

Checkbox.displayName = CheckboxPrimitives.Root.displayName;

export { Checkbox, checkboxVariants };
