import fs from "fs/promises";
import { outlinePath, projectDir } from "./paths";
import type { Outline } from "@/lib/types/project";

export async function getOutline(
  projectId: string
): Promise<Outline | null> {
  try {
    const data = await fs.readFile(outlinePath(projectId), "utf-8");
    return JSON.parse(data) as Outline;
  } catch {
    return null;
  }
}

export async function saveOutline(
  projectId: string,
  outline: Outline
): Promise<void> {
  await fs.mkdir(projectDir(projectId), { recursive: true });
  await fs.writeFile(outlinePath(projectId), JSON.stringify(outline, null, 2));
}
