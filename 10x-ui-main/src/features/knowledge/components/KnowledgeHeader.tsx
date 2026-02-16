/**
 * Knowledge Base Header Component
 * Contains search, filters, and view controls
 */

import { Asterisk, BookOpen, Briefcase, Grid, List, Plus, Search, Terminal } from "lucide-react";
import { Button, Input, ToggleGroup, ToggleGroupItem } from "../../ui/primitives";
import { cn } from "../../ui/primitives/styles";

interface KnowledgeHeaderProps {
  totalItems: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: "all" | "technical" | "business";
  onTypeFilterChange: (type: "all" | "technical" | "business") => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  onAddKnowledge: () => void;
}

export const KnowledgeHeader: React.FC<KnowledgeHeaderProps> = ({
  totalItems,
  isLoading,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  viewMode,
  onViewModeChange,
  onAddKnowledge,
}) => {
  return (
    <div className="flex flex-col gap-4 px-6 py-4 border-b border-border">
      {/* Row 1: Title and Add Button (always on same line) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <BookOpen className="h-7 w-7 text-[#C0745F] filter drop-shadow-[0_0_4px_rgba(192,116,95,0.4)]" />
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <span className="px-3 py-1 text-sm bg-muted border border-border rounded">
            {isLoading ? "Loading..." : `${totalItems} items`}
          </span>
        </div>

        {/* Add knowledge button - stays on top line */}
        <Button variant="knowledge" onClick={onAddKnowledge} className="shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Knowledge
        </Button>
      </div>

      {/* Row 2: Search and Filters (wraps on smaller screens) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-muted dark:bg-muted border-border dark:border-border focus:border-[#C0745F]/50"
          />
        </div>

        {/* Segmented type filters */}
        <ToggleGroup
          type="single"
          size="sm"
          value={typeFilter}
          onValueChange={(v) => v && onTypeFilterChange(v as "all" | "technical" | "business")}
          aria-label="Filter knowledge type"
        >
          <ToggleGroupItem value="all" aria-label="All" title="All" className="flex items-center justify-center">
            <Asterisk className="w-4 h-4" aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="technical"
            aria-label="Technical"
            title="Technical"
            className="flex items-center justify-center"
          >
            <Terminal className="w-4 h-4" aria-hidden="true" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="business"
            aria-label="Business"
            title="Business"
            className="flex items-center justify-center"
          >
            <Briefcase className="w-4 h-4" aria-hidden="true" />
          </ToggleGroupItem>
        </ToggleGroup>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            title="Grid view"
            className={cn(
              "px-3",
              viewMode === "grid"
                ? "bg-[#C0745F]/10 dark:bg-[#C0745F]/10 text-[#C0745F]"
                : "text-gray-400 hover:text-white",
            )}
          >
            <Grid className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("table")}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
            title="Table view"
            className={cn(
              "px-3",
              viewMode === "table"
                ? "bg-[#C0745F]/10 dark:bg-[#C0745F]/10 text-[#C0745F]"
                : "text-gray-400 hover:text-white",
            )}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};
