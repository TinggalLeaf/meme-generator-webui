"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MemeKey } from "@/lib/types";

interface TemplateListProps {
  items: MemeKey[];
  selected: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
  categories?: string[];
  category?: string;
  onCategoryChange?: (value: string) => void;
}

export function TemplateList({
  items,
  selected,
  onSelect,
  loading,
  categories = [],
  category,
  onCategoryChange,
}: TemplateListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && category !== "all" && item.key !== category) {
        // When a category filter is active and we don't know an item's category
        // we keep it (best-effort). Real category info comes from /info.
      }
      if (!q) return true;
      const name = (item.name ?? "").toLowerCase();
      return (
        item.key.toLowerCase().includes(q) || name.includes(q)
      );
    });
  }, [items, query, category]);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="搜索模板"
            placeholder="搜索模板…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {categories.length > 0 && onCategoryChange && (
          <select
            aria-label="分类筛选"
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            value={category ?? "all"}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2">
          {filtered.length === 0 && (
            <li className="p-4 text-center text-sm text-muted-foreground">
              没有匹配的模板
            </li>
          )}
          {filtered.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={selected === item.key}
                className={cn(
                  "mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  selected === item.key
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-foreground"
                )}
              >
                <span className="block truncate">{item.name ?? item.key}</span>
                {item.name && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.key}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
