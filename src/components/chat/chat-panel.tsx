"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { Send, Square } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-sse-chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onSend: (message: string) => void;
  onStop: () => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function ChatPanel({
  messages,
  isStreaming,
  streamingContent,
  onSend,
  onStop,
  placeholder = "输入你的想法...",
  emptyMessage = "开始你的创作之旅吧！",
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-2">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={onStop}
              className="shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
