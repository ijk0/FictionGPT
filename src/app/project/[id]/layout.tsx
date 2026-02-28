"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProjectSidebar } from "@/components/project/project-sidebar";
import { useProject } from "@/hooks/use-project";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header projectTitle={project?.title} />
      <div className="flex-1 flex overflow-hidden pb-12 md:pb-0">
        <ProjectSidebar
          projectId={projectId}
          status={project?.status || "brainstorm"}
        />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
