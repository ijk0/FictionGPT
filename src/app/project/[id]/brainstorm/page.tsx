"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { useSSEChat } from "@/hooks/use-sse-chat";
import { SplitLayout } from "@/components/layout/split-layout";
import { ChatPanel } from "@/components/chat/chat-panel";
import { StoryCanvas } from "@/components/canvas/story-canvas";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { StoryCanvas as StoryCanvasType } from "@/lib/types/project";

export default function BrainstormPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, canvas, setCanvas } = useProject(projectId);

  const handleCanvasUpdate = useCallback(
    (data: unknown) => {
      setCanvas(data as StoryCanvasType);
    },
    [setCanvas]
  );

  const {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
  } = useSSEChat(`/api/brainstorm/stream?projectId=${projectId}`, {
    onCanvasUpdate: handleCanvasUpdate,
  });

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, {
        projectId,
        ...(project?.brainstormSessionId
          ? { sessionId: project.brainstormSessionId }
          : {}),
      });
    },
    [sendMessage, projectId, project?.brainstormSessionId]
  );

  const canProceed =
    canvas?.premise && canvas.characters.length > 0 && !isStreaming;

  const handleProceed = () => {
    router.push(`/project/${projectId}/outline`);
  };

  return (
    <div className="h-full flex flex-col">
      {canProceed && (
        <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/30">
          <span className="text-sm text-muted-foreground">
            故事画布已有足够内容，可以生成大纲了
          </span>
          <Button size="sm" onClick={handleProceed}>
            生成大纲
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          left={
            <ChatPanel
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSend={handleSend}
              onStop={stopStreaming}
              placeholder="描述你的故事灵感..."
              emptyMessage="告诉我你想写什么样的故事？任何灵感都可以！"
            />
          }
          right={<StoryCanvas canvas={canvas} />}
        />
      </div>
    </div>
  );
}
