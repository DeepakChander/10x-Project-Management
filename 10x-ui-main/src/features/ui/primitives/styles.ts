/**
 * Shared style utilities for Radix primitives
 * Warm copper/terracotta glassmorphism design system (10x.in inspired)
 *
 * Theme Support:
 * - All styles use Tailwind's dark: prefix for automatic theme switching
 * - Theme is managed by ThemeContext (light/dark)
 * - For runtime theme values, use useThemeAware hook
 *
 * Palette:
 * - Copper:     #C0745F  rgb(192,116,95)
 * - Sage:       #5B8C5A  rgb(91,140,90)
 * - Amber:      #D4A04A  rgb(212,160,74)
 * - Terracotta: #B85C38  rgb(184,92,56)
 * - Stone:      #78716C  (Tailwind stone-500)
 * - Warm Gray:  #A8A29E  (Tailwind stone-400)
 */

// Base glassmorphism classes with warm aesthetic - light-mode-first
export const glassmorphism = {
  // Background variations - light-mode-first with warm tones
  background: {
    subtle: "backdrop-blur-xl bg-white/70 dark:bg-white/5",
    strong: "backdrop-blur-xl bg-white/80 dark:bg-white/8",
    card: "backdrop-blur-xl bg-white/70 dark:bg-white/5",
    // Warm-palette colored backgrounds
    cyan: "backdrop-blur-xl bg-[#C0745F]/5 dark:bg-[#C0745F]/10",
    blue: "backdrop-blur-xl bg-[#5B8C5A]/5 dark:bg-[#5B8C5A]/10",
    purple: "backdrop-blur-xl bg-amber-500/5 dark:bg-amber-400/10",
  },

  // Border styles - warm stone defaults with copper/sage/amber accents
  border: {
    default: "border border-stone-200/60 dark:border-stone-700/30",
    cyan: "border border-[#C0745F]/30 dark:border-[#C0745F]/20",
    blue: "border border-[#5B8C5A]/30 dark:border-[#5B8C5A]/20",
    purple: "border border-amber-500/30 dark:border-amber-400/20",
    focus: "focus:border-[#C0745F] focus:shadow-[0_0_0_3px_rgba(192,116,95,0.15)]",
    hover: "hover:border-[#C0745F]/50",
  },

  // Interactive states
  interactive: {
    base: "transition-all duration-200",
    hover: "hover:bg-[#C0745F]/8 dark:hover:bg-[#C0745F]/10",
    active: "active:bg-[#C0745F]/15 dark:active:bg-[#C0745F]/20",
    selected:
      "data-[state=checked]:bg-[#C0745F]/15 dark:data-[state=checked]:bg-[#C0745F]/20 data-[state=checked]:text-[#9A5B47] dark:data-[state=checked]:text-[#D4977F]",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },

  // Animation presets
  animation: {
    fadeIn:
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    slideIn: "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    slideFromTop: "data-[side=bottom]:slide-in-from-top-2",
    slideFromBottom: "data-[side=top]:slide-in-from-bottom-2",
    slideFromLeft: "data-[side=right]:slide-in-from-left-2",
    slideFromRight: "data-[side=left]:slide-in-from-right-2",
  },

  // Shadow effects with subtle warm glow
  shadow: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg dark:shadow-2xl",
    elevated: "shadow-[0_10px_30px_-15px_rgba(120,113,108,0.12)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]",
    // Subtle warm glow effects
    glow: {
      purple: "shadow-[0_0_12px_rgba(212,160,74,0.15)] dark:shadow-[0_0_18px_rgba(212,160,74,0.25)]",
      blue: "shadow-[0_0_12px_rgba(91,140,90,0.15)] dark:shadow-[0_0_18px_rgba(91,140,90,0.25)]",
      green: "shadow-[0_0_12px_rgba(91,140,90,0.15)] dark:shadow-[0_0_18px_rgba(91,140,90,0.25)]",
      red: "shadow-[0_0_12px_rgba(184,92,56,0.15)] dark:shadow-[0_0_18px_rgba(184,92,56,0.25)]",
      orange: "shadow-[0_0_12px_rgba(192,116,95,0.15)] dark:shadow-[0_0_18px_rgba(192,116,95,0.25)]",
      cyan: "shadow-[0_0_12px_rgba(192,116,95,0.15)] dark:shadow-[0_0_18px_rgba(192,116,95,0.25)]",
      pink: "shadow-[0_0_12px_rgba(212,160,74,0.15)] dark:shadow-[0_0_18px_rgba(212,160,74,0.25)]",
    },
  },

  // Edge glow positions
  edgePositions: {
    none: "",
    top: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px]",
    left: "before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2px]",
    right: "before:content-[''] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-[2px]",
    bottom: "before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px]",
  },

  // Configurable sizes for cards
  sizes: {
    card: {
      sm: "p-4 max-w-sm",
      md: "p-6 max-w-md",
      lg: "p-8 max-w-lg",
      xl: "p-10 max-w-xl",
    },
  },

  // Priority colors (matching the task system, shifted to warm palette)
  priority: {
    critical: {
      background: "bg-red-100/80 dark:bg-red-500/20",
      text: "text-red-600 dark:text-red-400",
      hover: "hover:bg-red-200 dark:hover:bg-red-500/30",
      glow: "hover:shadow-[0_0_8px_rgba(184,92,56,0.2)]",
    },
    high: {
      background: "bg-orange-100/80 dark:bg-orange-500/20",
      text: "text-orange-600 dark:text-orange-400",
      hover: "hover:bg-orange-200 dark:hover:bg-orange-500/30",
      glow: "hover:shadow-[0_0_8px_rgba(192,116,95,0.2)]",
    },
    medium: {
      background: "bg-amber-100/80 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
      hover: "hover:bg-amber-200 dark:hover:bg-amber-500/30",
      glow: "hover:shadow-[0_0_8px_rgba(212,160,74,0.2)]",
    },
    low: {
      background: "bg-stone-100/80 dark:bg-stone-500/20",
      text: "text-stone-600 dark:text-stone-400",
      hover: "hover:bg-stone-200 dark:hover:bg-stone-500/30",
      glow: "hover:shadow-[0_0_8px_rgba(120,113,108,0.2)]",
    },
  },
};

// Card-specific glass styles with warm accent colors
export const glassCard = {
  // Base glass card - warm, subtle rounding
  base: "relative rounded-lg overflow-hidden border transition-all duration-300",

  // Blur intensity levels
  blur: {
    none: "backdrop-blur-none", // No blur (0px)
    sm: "backdrop-blur-sm", // 4px - Light glass
    md: "backdrop-blur-md", // 12px - Medium glass
    lg: "backdrop-blur-lg", // 16px - Strong glass
    xl: "backdrop-blur-xl", // 24px - Very strong glass
    "2xl": "backdrop-blur-2xl", // 40px - Heavy glass
    "3xl": "backdrop-blur-3xl", // 64px - Maximum glass
  },

  // Glass transparency levels - light-mode-first, warmer and more opaque
  transparency: {
    clear: "bg-white/[0.45] dark:bg-white/[0.02]", // Warm clear - still readable in light
    light: "bg-white/[0.55] dark:bg-white/[0.05]", // Light warm glass
    medium: "bg-white/[0.65] dark:bg-white/[0.08]", // Medium warm glass
    frosted: "bg-white/[0.80] dark:bg-stone-900/[0.40]", // Frosted warm glass
    solid: "bg-white/[0.92] dark:bg-stone-950/[0.95]", // Nearly opaque warm
  },

  // Edge color mappings for DataCard (warm palette)
  edgeColors: {
    purple: {
      solid: "bg-amber-500",
      gradient: "from-amber-500/40",
      border: "border-amber-500/30",
      bg: "bg-gradient-to-br from-amber-500/8 to-amber-600/3",
    },
    blue: {
      solid: "bg-[#5B8C5A]",
      gradient: "from-[#5B8C5A]/40",
      border: "border-[#5B8C5A]/30",
      bg: "bg-gradient-to-br from-[#5B8C5A]/8 to-[#4A7349]/3",
    },
    cyan: {
      solid: "bg-[#C0745F]",
      gradient: "from-[#C0745F]/40",
      border: "border-[#C0745F]/30",
      bg: "bg-gradient-to-br from-[#C0745F]/8 to-[#9A5B47]/3",
    },
    green: {
      solid: "bg-[#5B8C5A]",
      gradient: "from-[#5B8C5A]/40",
      border: "border-[#5B8C5A]/30",
      bg: "bg-gradient-to-br from-[#5B8C5A]/8 to-[#4A7349]/3",
    },
    orange: {
      solid: "bg-[#C0745F]",
      gradient: "from-[#C0745F]/40",
      border: "border-[#C0745F]/30",
      bg: "bg-gradient-to-br from-[#C0745F]/8 to-[#B85C38]/3",
    },
    pink: {
      solid: "bg-[#D4A04A]",
      gradient: "from-[#D4A04A]/40",
      border: "border-[#D4A04A]/30",
      bg: "bg-gradient-to-br from-[#D4A04A]/8 to-[#B8893A]/3",
    },
    red: {
      solid: "bg-[#B85C38]",
      gradient: "from-[#B85C38]/40",
      border: "border-[#B85C38]/30",
      bg: "bg-gradient-to-br from-[#B85C38]/8 to-[#9A4A2C]/3",
    },
  },

  // Colored glass tints - warm earth tones with reduced intensity
  tints: {
    none: "",
    purple: {
      clear: "bg-amber-500/[0.03] dark:bg-amber-400/[0.04]",
      light: "bg-amber-500/[0.06] dark:bg-amber-400/[0.08]",
      medium: "bg-amber-500/[0.10] dark:bg-amber-400/[0.14]",
      frosted: "bg-amber-500/[0.18] dark:bg-amber-400/[0.25]",
      solid: "bg-amber-500/[0.28] dark:bg-amber-400/[0.40]",
    },
    blue: {
      clear: "bg-[#5B8C5A]/[0.03] dark:bg-[#5B8C5A]/[0.04]",
      light: "bg-[#5B8C5A]/[0.06] dark:bg-[#5B8C5A]/[0.08]",
      medium: "bg-[#5B8C5A]/[0.10] dark:bg-[#5B8C5A]/[0.14]",
      frosted: "bg-[#5B8C5A]/[0.18] dark:bg-[#5B8C5A]/[0.25]",
      solid: "bg-[#5B8C5A]/[0.28] dark:bg-[#5B8C5A]/[0.40]",
    },
    cyan: {
      clear: "bg-[#C0745F]/[0.03] dark:bg-[#C0745F]/[0.04]",
      light: "bg-[#C0745F]/[0.06] dark:bg-[#C0745F]/[0.08]",
      medium: "bg-[#C0745F]/[0.10] dark:bg-[#C0745F]/[0.14]",
      frosted: "bg-[#C0745F]/[0.18] dark:bg-[#C0745F]/[0.25]",
      solid: "bg-[#C0745F]/[0.28] dark:bg-[#C0745F]/[0.40]",
    },
    green: {
      clear: "bg-[#5B8C5A]/[0.03] dark:bg-[#5B8C5A]/[0.04]",
      light: "bg-[#5B8C5A]/[0.06] dark:bg-[#5B8C5A]/[0.08]",
      medium: "bg-[#5B8C5A]/[0.10] dark:bg-[#5B8C5A]/[0.14]",
      frosted: "bg-[#5B8C5A]/[0.18] dark:bg-[#5B8C5A]/[0.25]",
      solid: "bg-[#5B8C5A]/[0.28] dark:bg-[#5B8C5A]/[0.40]",
    },
    orange: {
      clear: "bg-[#C0745F]/[0.03] dark:bg-[#C0745F]/[0.04]",
      light: "bg-[#C0745F]/[0.06] dark:bg-[#C0745F]/[0.08]",
      medium: "bg-[#C0745F]/[0.10] dark:bg-[#C0745F]/[0.14]",
      frosted: "bg-[#C0745F]/[0.18] dark:bg-[#C0745F]/[0.25]",
      solid: "bg-[#C0745F]/[0.28] dark:bg-[#C0745F]/[0.40]",
    },
    pink: {
      clear: "bg-[#D4A04A]/[0.03] dark:bg-[#D4A04A]/[0.04]",
      light: "bg-[#D4A04A]/[0.06] dark:bg-[#D4A04A]/[0.08]",
      medium: "bg-[#D4A04A]/[0.10] dark:bg-[#D4A04A]/[0.14]",
      frosted: "bg-[#D4A04A]/[0.18] dark:bg-[#D4A04A]/[0.25]",
      solid: "bg-[#D4A04A]/[0.28] dark:bg-[#D4A04A]/[0.40]",
    },
    red: {
      clear: "bg-[#B85C38]/[0.03] dark:bg-[#B85C38]/[0.04]",
      light: "bg-[#B85C38]/[0.06] dark:bg-[#B85C38]/[0.08]",
      medium: "bg-[#B85C38]/[0.10] dark:bg-[#B85C38]/[0.14]",
      frosted: "bg-[#B85C38]/[0.18] dark:bg-[#B85C38]/[0.25]",
      solid: "bg-[#B85C38]/[0.28] dark:bg-[#B85C38]/[0.40]",
    },
  },

  // Warm subtle shadow variants
  variants: {
    none: {
      border: "border-stone-200/40 dark:border-stone-700/20",
      glow: "",
      hover: "hover:bg-white/[0.04] dark:hover:bg-white/[0.02]",
    },
    purple: {
      border: "border-amber-500/30 dark:border-amber-400/20",
      glow: "shadow-[0_0_12px_rgba(212,160,74,0.12)] dark:shadow-[0_0_16px_rgba(212,160,74,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(212,160,74,0.18)] dark:hover:shadow-[0_0_20px_rgba(212,160,74,0.28)]",
    },
    blue: {
      border: "border-[#5B8C5A]/30 dark:border-[#5B8C5A]/20",
      glow: "shadow-[0_0_12px_rgba(91,140,90,0.12)] dark:shadow-[0_0_16px_rgba(91,140,90,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(91,140,90,0.18)] dark:hover:shadow-[0_0_20px_rgba(91,140,90,0.28)]",
    },
    green: {
      border: "border-[#5B8C5A]/30 dark:border-[#5B8C5A]/20",
      glow: "shadow-[0_0_12px_rgba(91,140,90,0.12)] dark:shadow-[0_0_16px_rgba(91,140,90,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(91,140,90,0.18)] dark:hover:shadow-[0_0_20px_rgba(91,140,90,0.28)]",
    },
    cyan: {
      border: "border-[#C0745F]/30 dark:border-[#C0745F]/20",
      glow: "shadow-[0_0_12px_rgba(192,116,95,0.12)] dark:shadow-[0_0_16px_rgba(192,116,95,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(192,116,95,0.18)] dark:hover:shadow-[0_0_20px_rgba(192,116,95,0.28)]",
    },
    orange: {
      border: "border-[#C0745F]/30 dark:border-[#C0745F]/20",
      glow: "shadow-[0_0_12px_rgba(192,116,95,0.12)] dark:shadow-[0_0_16px_rgba(192,116,95,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(192,116,95,0.18)] dark:hover:shadow-[0_0_20px_rgba(192,116,95,0.28)]",
    },
    pink: {
      border: "border-[#D4A04A]/30 dark:border-[#D4A04A]/20",
      glow: "shadow-[0_0_12px_rgba(212,160,74,0.12)] dark:shadow-[0_0_16px_rgba(212,160,74,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(212,160,74,0.18)] dark:hover:shadow-[0_0_20px_rgba(212,160,74,0.28)]",
    },
    red: {
      border: "border-[#B85C38]/30 dark:border-[#B85C38]/20",
      glow: "shadow-[0_0_12px_rgba(184,92,56,0.12)] dark:shadow-[0_0_16px_rgba(184,92,56,0.20)]",
      hover: "hover:shadow-[0_0_16px_rgba(184,92,56,0.18)] dark:hover:shadow-[0_0_20px_rgba(184,92,56,0.28)]",
    },
  },

  // Outer glow size variants - subtle warm tones
  outerGlowSizes: {
    cyan: {
      sm: "shadow-[0_0_8px_rgba(192,116,95,0.10)]",
      md: "shadow-[0_0_14px_rgba(192,116,95,0.14)]",
      lg: "shadow-[0_0_22px_rgba(192,116,95,0.18)]",
      xl: "shadow-[0_0_32px_rgba(192,116,95,0.22)]",
    },
    purple: {
      sm: "shadow-[0_0_8px_rgba(212,160,74,0.10)]",
      md: "shadow-[0_0_14px_rgba(212,160,74,0.14)]",
      lg: "shadow-[0_0_22px_rgba(212,160,74,0.18)]",
      xl: "shadow-[0_0_32px_rgba(212,160,74,0.22)]",
    },
    blue: {
      sm: "shadow-[0_0_8px_rgba(91,140,90,0.10)]",
      md: "shadow-[0_0_14px_rgba(91,140,90,0.14)]",
      lg: "shadow-[0_0_22px_rgba(91,140,90,0.18)]",
      xl: "shadow-[0_0_32px_rgba(91,140,90,0.22)]",
    },
    pink: {
      sm: "shadow-[0_0_8px_rgba(212,160,74,0.10)]",
      md: "shadow-[0_0_14px_rgba(212,160,74,0.14)]",
      lg: "shadow-[0_0_22px_rgba(212,160,74,0.18)]",
      xl: "shadow-[0_0_32px_rgba(212,160,74,0.22)]",
    },
    green: {
      sm: "shadow-[0_0_8px_rgba(91,140,90,0.10)]",
      md: "shadow-[0_0_14px_rgba(91,140,90,0.14)]",
      lg: "shadow-[0_0_22px_rgba(91,140,90,0.18)]",
      xl: "shadow-[0_0_32px_rgba(91,140,90,0.22)]",
    },
    orange: {
      sm: "shadow-[0_0_8px_rgba(192,116,95,0.10)]",
      md: "shadow-[0_0_14px_rgba(192,116,95,0.14)]",
      lg: "shadow-[0_0_22px_rgba(192,116,95,0.18)]",
      xl: "shadow-[0_0_32px_rgba(192,116,95,0.22)]",
    },
    red: {
      sm: "shadow-[0_0_8px_rgba(184,92,56,0.10)]",
      md: "shadow-[0_0_14px_rgba(184,92,56,0.14)]",
      lg: "shadow-[0_0_22px_rgba(184,92,56,0.18)]",
      xl: "shadow-[0_0_32px_rgba(184,92,56,0.22)]",
    },
  },

  // Inner glow variants - subtle warm inner light
  innerGlowSizes: {
    cyan: {
      sm: "shadow-[inset_0_0_10px_rgba(192,116,95,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(192,116,95,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(192,116,95,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(192,116,95,0.20)]",
    },
    purple: {
      sm: "shadow-[inset_0_0_10px_rgba(212,160,74,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(212,160,74,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(212,160,74,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(212,160,74,0.20)]",
    },
    blue: {
      sm: "shadow-[inset_0_0_10px_rgba(91,140,90,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(91,140,90,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(91,140,90,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(91,140,90,0.20)]",
    },
    pink: {
      sm: "shadow-[inset_0_0_10px_rgba(212,160,74,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(212,160,74,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(212,160,74,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(212,160,74,0.20)]",
    },
    green: {
      sm: "shadow-[inset_0_0_10px_rgba(91,140,90,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(91,140,90,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(91,140,90,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(91,140,90,0.20)]",
    },
    orange: {
      sm: "shadow-[inset_0_0_10px_rgba(192,116,95,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(192,116,95,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(192,116,95,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(192,116,95,0.20)]",
    },
    red: {
      sm: "shadow-[inset_0_0_10px_rgba(184,92,56,0.08)]",
      md: "shadow-[inset_0_0_20px_rgba(184,92,56,0.12)]",
      lg: "shadow-[inset_0_0_35px_rgba(184,92,56,0.16)]",
      xl: "shadow-[inset_0_0_50px_rgba(184,92,56,0.20)]",
    },
  },

  // Hover glow variants - slightly intensified warm tones
  outerGlowHover: {
    cyan: {
      sm: "hover:shadow-[0_0_10px_rgba(192,116,95,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(192,116,95,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(192,116,95,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(192,116,95,0.28)]",
    },
    purple: {
      sm: "hover:shadow-[0_0_10px_rgba(212,160,74,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(212,160,74,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(212,160,74,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(212,160,74,0.28)]",
    },
    blue: {
      sm: "hover:shadow-[0_0_10px_rgba(91,140,90,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(91,140,90,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(91,140,90,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(91,140,90,0.28)]",
    },
    pink: {
      sm: "hover:shadow-[0_0_10px_rgba(212,160,74,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(212,160,74,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(212,160,74,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(212,160,74,0.28)]",
    },
    green: {
      sm: "hover:shadow-[0_0_10px_rgba(91,140,90,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(91,140,90,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(91,140,90,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(91,140,90,0.28)]",
    },
    orange: {
      sm: "hover:shadow-[0_0_10px_rgba(192,116,95,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(192,116,95,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(192,116,95,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(192,116,95,0.28)]",
    },
    red: {
      sm: "hover:shadow-[0_0_10px_rgba(184,92,56,0.16)]",
      md: "hover:shadow-[0_0_18px_rgba(184,92,56,0.20)]",
      lg: "hover:shadow-[0_0_28px_rgba(184,92,56,0.24)]",
      xl: "hover:shadow-[0_0_38px_rgba(184,92,56,0.28)]",
    },
  },

  innerGlowHover: {
    cyan: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(192,116,95,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(192,116,95,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(192,116,95,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(192,116,95,0.26)]",
    },
    purple: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(212,160,74,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(212,160,74,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(212,160,74,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(212,160,74,0.26)]",
    },
    blue: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(91,140,90,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(91,140,90,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(91,140,90,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(91,140,90,0.26)]",
    },
    pink: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(212,160,74,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(212,160,74,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(212,160,74,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(212,160,74,0.26)]",
    },
    green: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(91,140,90,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(91,140,90,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(91,140,90,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(91,140,90,0.26)]",
    },
    orange: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(192,116,95,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(192,116,95,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(192,116,95,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(192,116,95,0.26)]",
    },
    red: {
      sm: "hover:shadow-[inset_0_0_12px_rgba(184,92,56,0.14)]",
      md: "hover:shadow-[inset_0_0_24px_rgba(184,92,56,0.18)]",
      lg: "hover:shadow-[inset_0_0_40px_rgba(184,92,56,0.22)]",
      xl: "hover:shadow-[inset_0_0_56px_rgba(184,92,56,0.26)]",
    },
  },

  // Size variants
  sizes: {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  },

  // Edge-lit effects for cards - warm palette
  edgeLit: {
    position: {
      none: "",
      top: "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:rounded-t-lg",
      left: "before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:w-[2px] before:rounded-l-lg",
      right:
        "before:content-[''] before:absolute before:top-0 before:right-0 before:bottom-0 before:w-[2px] before:rounded-r-lg",
      bottom:
        "before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px] before:rounded-b-lg",
    },
    color: {
      purple: {
        line: "before:bg-amber-500 dark:before:bg-amber-400",
        glow: "before:shadow-[0_0_8px_2px_rgba(212,160,74,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-amber-500 dark:before:via-amber-400 before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-amber-500 dark:before:via-amber-400 before:to-transparent",
        },
      },
      blue: {
        line: "before:bg-[#5B8C5A] dark:before:bg-[#6CA06B]",
        glow: "before:shadow-[0_0_8px_2px_rgba(91,140,90,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#5B8C5A] dark:before:via-[#6CA06B] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#5B8C5A] dark:before:via-[#6CA06B] before:to-transparent",
        },
      },
      cyan: {
        line: "before:bg-[#C0745F] dark:before:bg-[#D4977F]",
        glow: "before:shadow-[0_0_8px_2px_rgba(192,116,95,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#C0745F] dark:before:via-[#D4977F] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#C0745F] dark:before:via-[#D4977F] before:to-transparent",
        },
      },
      green: {
        line: "before:bg-[#5B8C5A] dark:before:bg-[#6CA06B]",
        glow: "before:shadow-[0_0_8px_2px_rgba(91,140,90,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#5B8C5A] dark:before:via-[#6CA06B] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#5B8C5A] dark:before:via-[#6CA06B] before:to-transparent",
        },
      },
      orange: {
        line: "before:bg-[#C0745F] dark:before:bg-[#D4977F]",
        glow: "before:shadow-[0_0_8px_2px_rgba(192,116,95,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#C0745F] dark:before:via-[#D4977F] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#C0745F] dark:before:via-[#D4977F] before:to-transparent",
        },
      },
      pink: {
        line: "before:bg-[#D4A04A] dark:before:bg-[#E0B560]",
        glow: "before:shadow-[0_0_8px_2px_rgba(212,160,74,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#D4A04A] dark:before:via-[#E0B560] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#D4A04A] dark:before:via-[#E0B560] before:to-transparent",
        },
      },
      red: {
        line: "before:bg-[#B85C38] dark:before:bg-[#D47050]",
        glow: "before:shadow-[0_0_8px_2px_rgba(184,92,56,0.3)]",
        gradient: {
          horizontal:
            "before:bg-gradient-to-r before:from-transparent before:via-[#B85C38] dark:before:via-[#D47050] before:to-transparent",
          vertical:
            "before:bg-gradient-to-b before:from-transparent before:via-[#B85C38] dark:before:via-[#D47050] before:to-transparent",
        },
      },
    },
  },
};

// Compound styles for common patterns
export const compoundStyles = {
  // Standard interactive element (buttons, menu items, etc.)
  interactiveElement: `
    ${glassmorphism.interactive.base}
    ${glassmorphism.interactive.hover}
    ${glassmorphism.interactive.disabled}
  `,

  // Floating panels (dropdowns, popovers, tooltips)
  floatingPanel: `
    ${glassmorphism.background.strong}
    ${glassmorphism.border.default}
    ${glassmorphism.shadow.lg}
    ${glassmorphism.animation.fadeIn}
    ${glassmorphism.animation.slideIn}
  `,

  // Form controls (inputs, selects, etc.)
  formControl: `
    ${glassmorphism.background.subtle}
    ${glassmorphism.border.default}
    ${glassmorphism.border.hover}
    ${glassmorphism.border.focus}
    ${glassmorphism.interactive.base}
    ${glassmorphism.interactive.disabled}
  `,

  // Cards - use glassCard instead
  card: `
    ${glassmorphism.background.card}
    ${glassmorphism.border.default}
    ${glassmorphism.shadow.md}
  `,
};

// Utility function to combine classes
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
