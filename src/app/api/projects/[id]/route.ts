import { NextRequest, NextResponse } from "next/server";
import {
  getProject,
  updateProject,
  deleteProject,
} from "@/lib/storage/projects";
import { getCanvas } from "@/lib/storage/canvas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const canvas = await getCanvas(id);

  let outline = null;
  try {
    const { getOutline } = await import("@/lib/storage/outline");
    outline = await getOutline(id);
  } catch {
    // outline doesn't exist yet
  }

  return NextResponse.json({ project, canvas, outline });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const project = await updateProject(id, body);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ success: true });
}
