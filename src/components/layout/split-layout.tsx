"use client";

import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  leftWidth?: string;
}

export function SplitLayout({
  left,
  right,
  className,
  leftWidth = "w-1/2",
}: SplitLayoutProps) {
  return (
    <div className={cn("flex h-full overflow-hidden", className)}>
      <div
        className={cn(
          "border-r border-border flex flex-col overflow-hidden",
          leftWidth
        )}
      >
        {left}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">{right}</div>
    </div>
  );
}
