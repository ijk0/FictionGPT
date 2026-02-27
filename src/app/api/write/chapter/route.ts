import { NextRequest, NextResponse } from "next/server";
import { runWriterAgent } from "@/lib/agents/writer-agent";
import { getProject, updateProject } from "@/lib/storage/projects";
import {
  getChapter,
  saveChapter,
  saveChapterSummary,
} from "@/lib/storage/chapters";
import { buildChapterContext } from "@/lib/context/context-builder";
import { getStyleModifier } from "@/lib/agents/prompts/styles";
import { createSSEStream, sseResponse } from "@/lib/utils/sse";
import type { ChapterSummary } from "@/lib/types/project";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function parseChapterSummary(text: string): ChapterSummary | null {
  const match = text.match(/<chapter_summary>([\s\S]*?)<\/chapter_summary>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as ChapterSummary;
  } catch {
    return null;
  }
}

function stripSummaryTag(text: string): string {
  return text
    .replace(/<chapter_summary>[\s\S]*?<\/chapter_summary>/g, "")
    .trim();
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const chapterNum = parseInt(
    req.nextUrl.searchParams.get("chapterNumber") || "0"
  );
  const check = req.nextUrl.searchParams.get("check");

  if (!projectId || !chapterNum) {
    return NextResponse.json(
      { error: "Missing projectId or chapterNumber" },
      { status: 400 }
    );
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check mode: just return existing content
  if (check) {
    const content = await getChapter(projectId, chapterNum);
    return NextResponse.json({
      exists: !!content,
      content: content || null,
    });
  }

  // Writing mode: stream via SSE
  const context = await buildChapterContext(projectId, chapterNum);
  const styleModifier = getStyleModifier(
    project.style,
    project.customStyleDescription
  );

  const { readable, writer } = createSSEStream();

  (async () => {
    try {
      let fullText = "";

      await updateProject(projectId, { status: "writing" });

      const agentGen = runWriterAgent({
        context,
        chapterNumber: chapterNum,
        styleModifier,
      });

      for await (const event of agentGen) {
        switch (event.type) {
          case "text":
            fullText += event.content;
            writer.sendEvent("text", { content: event.content });
            break;

          case "result": {
            const finalText = event.content || fullText;

            const summary = parseChapterSummary(finalText);
            if (summary) {
              await saveChapterSummary(projectId, chapterNum, summary);
              writer.sendEvent("summary", { summary });
            }

            const chapterContent = stripSummaryTag(finalText);
            if (chapterContent) {
              await saveChapter(projectId, chapterNum, chapterContent);
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
