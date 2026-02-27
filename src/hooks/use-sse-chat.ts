"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SSECallbacks {
  onCanvasUpdate?: (data: unknown) => void;
  onOutlineUpdate?: (data: unknown) => void;
  onSummaryUpdate?: (data: unknown) => void;
  onSessionId?: (sessionId: string) => void;
  onDone?: () => void;
}

export function useSSEChat(endpoint: string, callbacks?: SSECallbacks) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  const sendMessage = useCallback(
    async (content: string, extraParams?: Record<string, string>) => {
      if (isStreaming) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          message: content,
          ...extraParams,
        });

        const response = await fetch(`${endpoint}?${params}`, {
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
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
                    fullContent += data.content;
                    setStreamingContent(fullContent);
                    break;
                  case "canvas":
                    callbacks?.onCanvasUpdate?.(data.canvas);
                    break;
                  case "outline":
                    callbacks?.onOutlineUpdate?.(data.outline);
                    break;
                  case "summary":
                    callbacks?.onSummaryUpdate?.(data.summary);
                    break;
                  case "session":
                    callbacks?.onSessionId?.(data.sessionId);
                    break;
                  case "done":
                    callbacks?.onDone?.();
                    break;
                  case "error":
                    console.error("SSE error:", data.message);
                    break;
                }
              } catch {
                // ignore parse errors
              }
              eventType = "";
            }
          }
        }

        if (fullContent) {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullContent,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("SSE connection error:", err);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [endpoint, isStreaming, callbacks]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopStreaming,
    loadMessages,
  };
}
