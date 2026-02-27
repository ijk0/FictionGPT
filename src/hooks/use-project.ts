"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectMeta, StoryCanvas, Outline } from "@/lib/types/project";

export function useProject(projectId: string) {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [canvas, setCanvas] = useState<StoryCanvas | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setCanvas(data.canvas);
        if (data.outline) setOutline(data.outline);
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = useCallback(
    async (updates: Partial<ProjectMeta>) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    },
    [projectId]
  );

  return {
    project,
    canvas,
    outline,
    loading,
    setCanvas,
    setOutline,
    refresh: fetchProject,
    updateProject,
  };
}
