"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Circle, CheckCircle } from "lucide-react";
import type { ChapterOutline } from "@/lib/types/project";

interface ChapterListProps {
  chapters: ChapterOutline[];
  writtenChapters: number[];
  selectedChapter: number | null;
  onSelect: (num: number) => void;
}

export function ChapterList({
  chapters,
  writtenChapters,
  selectedChapter,
  onSelect,
}: ChapterListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {chapters.map((chapter) => {
          const isWritten = writtenChapters.includes(chapter.number);
          const isSelected = selectedChapter === chapter.number;

          return (
            <button
              key={chapter.number}
              onClick={() => onSelect(chapter.number)}
              className={cn(
                "w-full text-left p-2.5 rounded-md transition-colors flex items-start gap-2",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {isWritten ? (
                <CheckCircle
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    isSelected
                      ? "text-primary-foreground"
                      : "text-green-500"
                  )}
                />
              ) : (
                <Circle
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono opacity-60">
                    {String(chapter.number).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {chapter.title}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs mt-0.5 line-clamp-1",
                    isSelected
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {chapter.synopsis}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
