import { NextRequest } from "next/server";
import { runBrainstormAgent } from "@/lib/agents/brainstorm-agent";
import { updateCanvas, getCanvas } from "@/lib/storage/canvas";
import { getProject, updateProject } from "@/lib/storage/projects";
import { createSSEStream, sseResponse } from "@/lib/utils/sse";
import type { StoryCanvas } from "@/lib/types/project";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function parseCanvasUpdate(text: string): Partial<StoryCanvas> | null {
  const match = text.match(/<canvas_update>([\s\S]*?)<\/canvas_update>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Partial<StoryCanvas>;
  } catch {
    return null;
  }
}

function stripCanvasTag(text: string): string {
  return text.replace(/<canvas_update>[\s\S]*?<\/canvas_update>/g, "").trim();
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const message = req.nextUrl.searchParams.get("message");
  const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;

  if (!projectId || !message) {
    return new Response("Missing projectId or message", { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const { readable, writer } = createSSEStream();

  (async () => {
    try {
      let fullText = "";
      let currentSessionId = sessionId;

      const agentGen = runBrainstormAgent({
        message,
        sessionId: currentSessionId,
        projectId,
      });

      for await (const event of agentGen) {
        switch (event.type) {
          case "session":
            currentSessionId = event.sessionId;
            writer.sendEvent("session", { sessionId: event.sessionId });
            // Save session ID to project
            await updateProject(projectId, {
              brainstormSessionId: event.sessionId,
            });
            break;

          case "text":
            fullText += event.content;
            writer.sendEvent("text", { content: event.content });
            break;

          case "result": {
            // Try to parse canvas updates from the full text
            const finalText = event.content || fullText;
            const canvasUpdate = parseCanvasUpdate(finalText);
            if (canvasUpdate) {
              await updateCanvas(projectId, canvasUpdate);
              const updatedCanvas = await getCanvas(projectId);
              writer.sendEvent("canvas", { canvas: updatedCanvas });
            }
            break;
          }
        }
      }

      writer.sendEvent("done", {});
    } catch (err) {
      writer.sendEvent("error", {
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      writer.close();
    }
  })();

  return sseResponse(readable);
}
