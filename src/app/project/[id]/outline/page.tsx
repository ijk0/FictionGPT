"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { SplitLayout } from "@/components/layout/split-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { OutlineEditor } from "@/components/outline/outline-editor";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-sse-chat";
import type { Outline } from "@/lib/types/project";

const AGENT_TAG_RE = /<(canvas_update|outline_json|chapter_summary)>[\s\S]*?<\/\1>/g;
const PARTIAL_TAG_RE = /<(canvas_update|outline_json|chapter_summary)>[\s\S]*$/;

function stripAgentTags(text: string): string {
  return text.replace(AGENT_TAG_RE, "").replace(PARTIAL_TAG_RE, "").trim();
}

export default function OutlinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, outline, setOutline, updateProject } =
    useProject(projectId);
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setStreamingContent("");

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let fullText = "";

    try {
      const response = await fetch(
        `/api/outline/generate?projectId=${projectId}`,
        { signal: abortRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (eventType) {
                case "text":
                  fullText += data.content;
                  setStreamingContent(stripAgentTags(fullText));
                  break;
                case "outline":
                  setOutline(data.outline);
                  break;
              }
            } catch {
              // ignore parse errors
            }
            eventType = "";
          }
        }
      }

      const cleanContent = stripAgentTags(fullText);
      if (cleanContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: cleanContent,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Outline generation error:", err);
      }
    } finally {
      setGenerating(false);
      setStreamingContent("");
    }
  }, [projectId, setOutline]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
    setStreamingContent("");
  }, []);

  const canProceedToWrite = outline && outline.chapters.length > 0;

  const handleProceed = async () => {
    await updateProject({ status: "writing" });
    router.push(`/project/${projectId}/write`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          {!outline && (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  生成大纲
                </>
              )}
            </Button>
          )}
          {outline && !generating && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              重新生成
            </Button>
          )}
        </div>
        {canProceedToWrite && (
          <Button size="sm" onClick={handleProceed}>
            开始写作
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          left={
            <ChatPanel
              messages={messages}
              isStreaming={generating}
              streamingContent={streamingContent}
              onSend={() => {}}
              onStop={stopGenerating}
              placeholder="关于大纲的想法..."
              emptyMessage={'点击上方的"生成大纲"按钮开始'}
            />
          }
          right={<OutlineEditor outline={outline} />}
        />
      </div>
    </div>
  );
}
