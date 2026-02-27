"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project } = useProject(projectId);

  useEffect(() => {
    if (project) {
      const phase =
        project.status === "writing" || project.status === "completed"
          ? "write"
          : project.status;
      router.replace(`/project/${projectId}/${phase}`);
    }
  }, [project, projectId, router]);

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      重定向中...
    </div>
  );
}
