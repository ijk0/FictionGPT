import { NextRequest } from "next/server";
import { runOutlineAgent } from "@/lib/agents/outline-agent";
import { getCanvas } from "@/lib/storage/canvas";
import { getProject, updateProject } from "@/lib/storage/projects";
import { saveOutline } from "@/lib/storage/outline";
import { createSSEStream, sseResponse } from "@/lib/utils/sse";
import type { Outline } from "@/lib/types/project";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function parseOutlineJson(text: string): Outline | null {
  const match = text.match(/<outline_json>([\s\S]*?)<\/outline_json>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Outline;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const canvas = await getCanvas(projectId);
  if (!canvas || !canvas.premise) {
    return new Response("Canvas is empty, complete brainstorm first", {
      status: 400,
    });
  }

  const { readable, writer } = createSSEStream();

  (async () => {
    try {
      let fullText = "";

      const agentGen = runOutlineAgent({ canvas });

      for await (const event of agentGen) {
        switch (event.type) {
          case "text":
            fullText += event.content;
            writer.sendEvent("text", { content: event.content });
            break;

          case "result": {
            const finalText = event.content || fullText;
            const outline = parseOutlineJson(finalText);
            if (outline) {
              await saveOutline(projectId, outline);
              await updateProject(projectId, { status: "outline" });
              writer.sendEvent("outline", { outline });
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
