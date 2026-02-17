/**
 * Tag Input Component
 * Add and display tags on tasks
 */

import { X, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/primitives/button";
import { Input } from "../../ui/primitives/input";
import { cn } from "../../ui/primitives/styles";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  readonly?: boolean;
}

export function TagInput({ tags, onChange, readonly }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      {/* Display Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                "bg-[#C0745F]/10 text-[#C0745F] dark:bg-[#C0745F]/20 dark:text-[#D4917A]"
              )}
            >
              #{tag}
              {!readonly && (
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Add Tag Input */}
      {!readonly && (
        <div className="flex gap-2">
          <Input
            placeholder="Add tag (e.g., urgent, research, bug)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={addTag}
            size="sm"
            variant="outline"
            disabled={!inputValue.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {tags.length === 0 && readonly && (
        <p className="text-sm text-gray-500 italic">No tags</p>
      )}
    </div>
  );
}
