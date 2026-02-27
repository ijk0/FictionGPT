"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectMeta } from "@/lib/types/project";

const PHASE_LABELS: Record<string, string> = {
  brainstorm: "头脑风暴",
  outline: "大纲设计",
  writing: "写作中",
  completed: "已完成",
};

const STYLE_LABELS: Record<string, string> = {
  literary: "严肃文学",
  webnovel: "网络小说",
  mystery: "悬疑推理",
  scifi: "科幻",
  fantasy: "奇幻",
  romance: "言情",
  custom: "自定义",
};

export function ProjectCard({ project }: { project: ProjectMeta }) {
  const phaseLink =
    project.status === "completed"
      ? "write"
      : project.status === "writing"
        ? "write"
        : project.status;

  return (
    <Link href={`/project/${project.id}/${phaseLink}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{project.title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {PHASE_LABELS[project.status] || project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description || "暂无描述"}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {STYLE_LABELS[project.style] || project.style}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
