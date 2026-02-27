"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Outline, ChapterOutline } from "@/lib/types/project";

interface OutlineEditorProps {
  outline: Outline | null;
}

const TONE_COLORS: Record<string, string> = {
  紧张: "bg-red-100 text-red-700",
  温馨: "bg-amber-100 text-amber-700",
  悲伤: "bg-blue-100 text-blue-700",
  欢快: "bg-green-100 text-green-700",
  悬疑: "bg-purple-100 text-purple-700",
};

function ChapterCard({ chapter }: { chapter: ChapterOutline }) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              #{String(chapter.number).padStart(2, "0")}
            </span>
            <span className="font-medium text-sm">{chapter.title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {chapter.emotionalTone && (
              <Badge
                variant="outline"
                className={`text-xs ${TONE_COLORS[chapter.emotionalTone] || ""}`}
              >
                {chapter.emotionalTone}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              ~{chapter.estimatedWords}字
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {chapter.synopsis}
        </p>
        {chapter.keyEvents.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {chapter.keyEvents.map((event, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {event}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OutlineEditor({ outline }: OutlineEditorProps) {
  if (!outline) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        点击&quot;生成大纲&quot;开始
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          章节大纲（共 {outline.totalChapters} 章）
        </h3>
        <span className="text-sm text-muted-foreground">
          预计总字数：{(outline.estimatedWordCount / 10000).toFixed(1)}万字
        </span>
      </div>
      {outline.chapters.map((chapter) => (
        <ChapterCard key={chapter.number} chapter={chapter} />
      ))}
    </ScrollArea>
  );
}
