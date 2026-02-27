import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/storage/projects";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, style, customStyleDescription } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const project = await createProject({
    title,
    description: description || "",
    style: style || "literary",
    customStyleDescription,
  });

  return NextResponse.json(project, { status: 201 });
}
