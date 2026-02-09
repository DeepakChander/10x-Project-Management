import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";
import { cn } from "./styles";

// Root
export const Tabs = TabsPrimitive.Root;

// List - styled like pill navigation
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "backdrop-blur-sm bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/15",
      "rounded-full p-1 shadow-lg inline-flex gap-1",
      className,
    )}
    role="tablist"
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// Trigger
type TabColor = "blue" | "purple" | "pink" | "orange" | "cyan" | "green";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    color?: TabColor;
  }
>(({ className, color = "blue", ...props }, ref) => {
  const activeClasses = {
    blue: [
      "data-[state=active]:bg-[#5B8C5A]/10 dark:data-[state=active]:bg-[#5B8C5A]/15",
      "data-[state=active]:text-[#5B8C5A] dark:data-[state=active]:text-[#7DAC7C]",
      "data-[state=active]:border data-[state=active]:border-[#5B8C5A]/40",
    ].join(" "),
    purple: [
      "data-[state=active]:bg-amber-500/10 dark:data-[state=active]:bg-amber-400/15",
      "data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300",
      "data-[state=active]:border data-[state=active]:border-amber-400/40",
    ].join(" "),
    pink: [
      "data-[state=active]:bg-[#C0745F]/10 dark:data-[state=active]:bg-[#C0745F]/15",
      "data-[state=active]:text-[#C0745F] dark:data-[state=active]:text-[#D4907D]",
      "data-[state=active]:border data-[state=active]:border-[#C0745F]/40",
    ].join(" "),
    orange: [
      "data-[state=active]:bg-orange-500/10 dark:data-[state=active]:bg-orange-400/15",
      "data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300",
      "data-[state=active]:border data-[state=active]:border-orange-400/40",
    ].join(" "),
    cyan: [
      "data-[state=active]:bg-[#C0745F]/10 dark:data-[state=active]:bg-[#C0745F]/15",
      "data-[state=active]:text-[#C0745F] dark:data-[state=active]:text-[#D4907D]",
      "data-[state=active]:border data-[state=active]:border-[#C0745F]/40",
    ].join(" "),
    green: [
      "data-[state=active]:bg-green-500/10 dark:data-[state=active]:bg-green-400/15",
      "data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300",
      "data-[state=active]:border data-[state=active]:border-green-400/40",
    ].join(" "),
  } satisfies Record<TabColor, string>;

  const focusRingClasses = {
    blue: "focus-visible:ring-[#5B8C5A]",
    purple: "focus-visible:ring-amber-500",
    pink: "focus-visible:ring-[#C0745F]",
    orange: "focus-visible:ring-orange-500",
    cyan: "focus-visible:ring-[#C0745F]",
    green: "focus-visible:ring-green-500",
  } satisfies Record<TabColor, string>;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-200",
        "text-xs font-medium whitespace-nowrap",
        "text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        focusRingClasses[color],
        "disabled:pointer-events-none disabled:opacity-50",
        activeClasses[color],
        className,
      )}
      {...props}
    >
      {props.children}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// Content
export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
