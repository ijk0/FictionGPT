"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, List, PenTool } from "lucide-react";
import type { ProjectPhase } from "@/lib/types/project";

interface ProjectSidebarProps {
  projectId: string;
  status: ProjectPhase;
}

const NAV_ITEMS = [
  {
    label: "头脑风暴",
    href: "brainstorm",
    icon: MessageSquare,
    phase: "brainstorm" as const,
  },
  {
    label: "章节大纲",
    href: "outline",
    icon: List,
    phase: "outline" as const,
  },
  {
    label: "写作",
    href: "write",
    icon: PenTool,
    phase: "writing" as const,
  },
];

const PHASE_ORDER: ProjectPhase[] = [
  "brainstorm",
  "outline",
  "writing",
  "completed",
];

export function ProjectSidebar({ projectId, status }: ProjectSidebarProps) {
  const pathname = usePathname();
  const currentPhaseIndex = PHASE_ORDER.indexOf(status);

  return (
    <nav className="w-48 border-r border-border bg-muted/30 p-3 flex flex-col gap-1 shrink-0">
      {NAV_ITEMS.map((item) => {
        const itemPhaseIndex = PHASE_ORDER.indexOf(item.phase);
        const isActive = pathname?.includes(item.href);
        const isAccessible = itemPhaseIndex <= currentPhaseIndex;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={isAccessible ? `/project/${projectId}/${item.href}` : "#"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : isAccessible
                  ? "hover:bg-accent text-foreground"
                  : "text-muted-foreground cursor-not-allowed opacity-50"
            )}
            onClick={(e) => {
              if (!isAccessible) e.preventDefault();
            }}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
