"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { ChapterList } from "@/components/writing/chapter-list";
import { ChapterEditor } from "@/components/writing/chapter-editor";
import { Button } from "@/components/ui/button";
import { PenTool, Loader2 } from "lucide-react";

export default function WritePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { outline } = useProject(projectId);

  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [writtenChapters, setWrittenChapters] = useState<number[]>([]);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Load list of written chapters
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.outline) {
          // Check which chapters have content
          const checkChapters = async () => {
            const written: number[] = [];
            for (const ch of data.outline.chapters) {
              try {
                const res = await fetch(
                  `/api/write/chapter?projectId=${projectId}&chapterNumber=${ch.number}&check=true`
                );
                if (res.ok) {
                  const d = await res.json();
                  if (d.exists) written.push(ch.number);
                }
              } catch {
                // ignore
              }
            }
            setWrittenChapters(written);
          };
          checkChapters();
        }
      });
  }, [projectId]);

  // Load chapter content when selected
  useEffect(() => {
    if (selectedChapter && !isWriting) {
      fetch(
        `/api/write/chapter?projectId=${projectId}&chapterNumber=${selectedChapter}&check=true`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.content) {
            setChapterContent(data.content);
          } else {
            setChapterContent(null);
          }
        })
        .catch(() => setChapterContent(null));
    }
  }, [selectedChapter, projectId, isWriting]);

  const handleWriteChapter = useCallback(() => {
    if (!selectedChapter) return;
    setIsWriting(true);
    setStreamingContent("");
    setChapterContent(null);

    const evtSource = new EventSource(
      `/api/write/chapter?projectId=${projectId}&chapterNumber=${selectedChapter}`
    );

    let fullText = "";

    evtSource.addEventListener("text", (e) => {
      const data = JSON.parse(e.data);
      fullText += data.content;
      setStreamingContent(fullText);
    });

    evtSource.addEventListener("done", () => {
      evtSource.close();
      setIsWriting(false);
      setChapterContent(fullText);
      setStreamingContent("");
      setWrittenChapters((prev) =>
        prev.includes(selectedChapter) ? prev : [...prev, selectedChapter]
      );
    });

    evtSource.addEventListener("error", () => {
      evtSource.close();
      setIsWriting(false);
      if (fullText) {
        setChapterContent(fullText);
        setStreamingContent("");
      }
    });
  }, [selectedChapter, projectId]);

  if (!outline) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        请先完成大纲设计
      </div>
    );
  }

  const currentChapter = outline.chapters.find(
    (c) => c.number === selectedChapter
  );

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/30">
        <span className="text-sm font-medium">
          写作进度：{writtenChapters.length} / {outline.totalChapters} 章
        </span>
        {selectedChapter && !isWriting && (
          <Button size="sm" onClick={handleWriteChapter}>
            <PenTool className="h-4 w-4 mr-1" />
            {writtenChapters.includes(selectedChapter)
              ? "重写本章"
              : "开始写作"}
          </Button>
        )}
        {isWriting && (
          <Button size="sm" variant="secondary" disabled>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            写作中...
          </Button>
        )}
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-border shrink-0">
          <ChapterList
            chapters={outline.chapters}
            writtenChapters={writtenChapters}
            selectedChapter={selectedChapter}
            onSelect={setSelectedChapter}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChapterEditor
            chapter={currentChapter || null}
            content={chapterContent}
            isStreaming={isWriting}
            streamingContent={streamingContent}
          />
        </div>
      </div>
    </div>
  );
}
