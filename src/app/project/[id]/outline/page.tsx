"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { useSSEChat } from "@/hooks/use-sse-chat";
import { SplitLayout } from "@/components/layout/split-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { OutlineEditor } from "@/components/outline/outline-editor";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { Outline } from "@/lib/types/project";

export default function OutlinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, outline, setOutline, updateProject } =
    useProject(projectId);
  const [generating, setGenerating] = useState(false);

  const handleOutlineUpdate = useCallback(
    (data: unknown) => {
      setOutline(data as Outline);
    },
    [setOutline]
  );

  const {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
  } = useSSEChat(`/api/outline/generate?projectId=${projectId}`, {
    onOutlineUpdate: handleOutlineUpdate,
  });

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    // Trigger the outline generation via SSE
    const evtSource = new EventSource(
      `/api/outline/generate?projectId=${projectId}`
    );

    let fullText = "";

    evtSource.addEventListener("text", (e) => {
      fullText += JSON.parse(e.data).content;
    });

    evtSource.addEventListener("outline", (e) => {
      const data = JSON.parse(e.data);
      setOutline(data.outline);
    });

    evtSource.addEventListener("done", () => {
      evtSource.close();
      setGenerating(false);
    });

    evtSource.addEventListener("error", () => {
      evtSource.close();
      setGenerating(false);
    });
  }, [projectId, setOutline]);

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
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSend={(msg) => sendMessage(msg, { projectId })}
              onStop={stopStreaming}
              placeholder="关于大纲的想法..."
              emptyMessage={'点击上方的"生成大纲"按钮，或与 AI 讨论大纲结构'}
            />
          }
          right={<OutlineEditor outline={outline} />}
        />
      </div>
    </div>
  );
}
