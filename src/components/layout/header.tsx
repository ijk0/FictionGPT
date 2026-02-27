"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header({ projectTitle }: { projectTitle?: string }) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4 shrink-0">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <BookOpen className="h-5 w-5" />
        <span>FictionGPT</span>
      </Link>
      {projectTitle && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground truncate">{projectTitle}</span>
        </>
      )}
    </header>
  );
}
