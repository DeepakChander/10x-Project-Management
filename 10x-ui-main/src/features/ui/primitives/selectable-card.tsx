import { motion } from "framer-motion";
import React from "react";
import { Card, type CardProps } from "./card";
import { cn } from "./styles";

interface SelectableCardProps extends Omit<CardProps, "ref"> {
  // Selection state
  isSelected?: boolean;
  onSelect?: () => void;

  // Visual states
  isPinned?: boolean;
  showAuroraGlow?: boolean; // Aurora effect for selected state

  // Selection colors
  selectedBorderColor?: string;
  selectedShadow?: string;
  pinnedBorderColor?: string;
  pinnedShadow?: string;
}

export const SelectableCard = React.forwardRef<HTMLDivElement, SelectableCardProps>(
  (
    {
      isSelected = false,
      isPinned = false,
      showAuroraGlow = false,
      onSelect,
      selectedBorderColor = "border-[#C0745F]/60 dark:border-[#C0745F]/60",
      selectedShadow = "shadow-[0_4px_12px_rgba(192,116,95,0.15)] dark:shadow-[0_4px_12px_rgba(192,116,95,0.2)]",
      pinnedBorderColor = "border-[#C0745F]/80 dark:border-[#C0745F]/80",
      pinnedShadow = "shadow-[0_4px_12px_rgba(192,116,95,0.15)]",
      children,
      className,
      ...cardProps
    },
    ref,
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect?.();
      }
    };

    return (
      // biome-ignore lint/a11y/useSemanticElements: motion.div required for framer-motion animations - semantic button would break animation behavior
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        aria-selected={isSelected}
        className={cn(
          "cursor-pointer transition-all duration-300 overflow-visible",
          isSelected ? "scale-[1.02]" : "hover:scale-[1.01]",
        )}
        whileHover={{ scale: isSelected ? 1.02 : 1.01 }}
      >
        <div className="relative">
          {/* Aurora glow effect for selected state */}
          {isSelected && showAuroraGlow && (
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-xl overflow-hidden opacity-30 dark:opacity-40 pointer-events-none"
            >
              <div className="absolute -inset-[100px] bg-[radial-gradient(circle,rgba(192,116,95,0.5)_0%,rgba(192,116,95,0.3)_40%,transparent_70%)] blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
            </div>
          )}

          <Card
            ref={ref}
            {...cardProps}
            className={cn(
              isPinned && pinnedBorderColor,
              isPinned && pinnedShadow,
              isSelected && !isPinned && selectedBorderColor,
              isSelected && !isPinned && selectedShadow,
              className,
            )}
          >
            {children}
          </Card>
        </div>
      </motion.div>
    );
  },
);

SelectableCard.displayName = "SelectableCard";
