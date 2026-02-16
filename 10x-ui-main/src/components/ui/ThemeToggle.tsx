import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
interface ThemeToggleProps {
  accentColor?: 'copper' | 'sage' | 'rose' | 'stone' | 'purple' | 'green' | 'pink' | 'blue';
}
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  accentColor = 'copper'
}) => {
  const {
    theme,
    setTheme
  } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const accentColorMap: Record<string, { border: string; hover: string; text: string; bg: string }> = {
    copper: {
      border: 'border-[#C0745F]/30 dark:border-[#C0745F]/30',
      hover: 'hover:border-[#C0745F]/50 dark:hover:border-[#C0745F]/50',
      text: 'text-[#C0745F] dark:text-[#D4917A]',
      bg: 'from-[#C0745F]/10 to-[#C0745F]/5 dark:from-[#C0745F]/15 dark:to-[#C0745F]/5'
    },
    sage: {
      border: 'border-[#5B8C5A]/30 dark:border-[#5B8C5A]/30',
      hover: 'hover:border-[#5B8C5A]/50 dark:hover:border-[#5B8C5A]/50',
      text: 'text-[#5B8C5A] dark:text-[#7AAD79]',
      bg: 'from-[#5B8C5A]/10 to-[#5B8C5A]/5 dark:from-[#5B8C5A]/15 dark:to-[#5B8C5A]/5'
    },
    rose: {
      border: 'border-rose-300/40 dark:border-rose-400/30',
      hover: 'hover:border-rose-400/50 dark:hover:border-rose-400/50',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'from-rose-100/60 to-rose-50/40 dark:from-rose-900/15 dark:to-rose-900/5'
    },
    stone: {
      border: 'border-stone-300/50 dark:border-stone-600/30',
      hover: 'hover:border-stone-400/60 dark:hover:border-stone-500/50',
      text: 'text-stone-600 dark:text-stone-400',
      bg: 'from-stone-100/60 to-stone-50/40 dark:from-stone-800/15 dark:to-stone-800/5'
    },
    // Backward compatibility aliases
    purple: {
      border: 'border-[#C0745F]/30 dark:border-[#C0745F]/30',
      hover: 'hover:border-[#C0745F]/50 dark:hover:border-[#C0745F]/50',
      text: 'text-[#C0745F] dark:text-[#D4917A]',
      bg: 'from-[#C0745F]/10 to-[#C0745F]/5 dark:from-[#C0745F]/15 dark:to-[#C0745F]/5'
    },
    green: {
      border: 'border-[#5B8C5A]/30 dark:border-[#5B8C5A]/30',
      hover: 'hover:border-[#5B8C5A]/50 dark:hover:border-[#5B8C5A]/50',
      text: 'text-[#5B8C5A] dark:text-[#7AAD79]',
      bg: 'from-[#5B8C5A]/10 to-[#5B8C5A]/5 dark:from-[#5B8C5A]/15 dark:to-[#5B8C5A]/5'
    },
    pink: {
      border: 'border-rose-300/40 dark:border-rose-400/30',
      hover: 'hover:border-rose-400/50 dark:hover:border-rose-400/50',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'from-rose-100/60 to-rose-50/40 dark:from-rose-900/15 dark:to-rose-900/5'
    },
    blue: {
      border: 'border-stone-300/50 dark:border-stone-600/30',
      hover: 'hover:border-stone-400/60 dark:hover:border-stone-500/50',
      text: 'text-stone-600 dark:text-stone-400',
      bg: 'from-stone-100/60 to-stone-50/40 dark:from-stone-800/15 dark:to-stone-800/5'
    }
  };
  const colors = accentColorMap[accentColor] || accentColorMap.copper;
  return <button onClick={toggleTheme} className={`
        relative p-2 rounded-md backdrop-blur-md
        bg-gradient-to-b ${colors.bg}
        border ${colors.border} ${colors.hover}
        ${colors.text}
        shadow-sm
        transition-all duration-300 flex items-center justify-center
      `} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>;
};
