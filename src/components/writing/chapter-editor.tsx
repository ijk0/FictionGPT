"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { ChapterOutline } from "@/lib/types/project";

interface ChapterEditorProps {
  chapter: ChapterOutline | null;
  content: string | null;
  isStreaming: boolean;
  streamingContent: string;
}

export function ChapterEditor({
  chapter,
  content,
  isStreaming,
  streamingContent,
}: ChapterEditorProps) {
  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        从左侧选择一个章节开始写作
      </div>
    );
  }

  const displayContent = isStreaming ? streamingContent : content;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">
            第 {chapter.number} 章
          </span>
          <h2 className="font-semibold">{chapter.title}</h2>
          {chapter.emotionalTone && (
            <Badge variant="outline" className="text-xs">
              {chapter.emotionalTone}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{chapter.synopsis}</p>
      </div>
      <ScrollArea className="flex-1 p-6">
        {displayContent ? (
          <div className="max-w-2xl mx-auto">
            <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap leading-relaxed text-base">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-1.5 h-5 ml-0.5 bg-primary animate-pulse" />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            点击&quot;开始写作&quot;按钮生成本章内容
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
