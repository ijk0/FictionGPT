"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  leftWidth?: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function SplitLayout({
  left,
  right,
  className,
  leftWidth = "w-1/2",
  leftLabel = "对话",
  rightLabel = "内容",
}: SplitLayoutProps) {
  const [activeTab, setActiveTab] = useState<"left" | "right">("left");

  return (
    <div className={cn("flex flex-col md:flex-row h-full overflow-hidden", className)}>
      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab("left")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium text-center transition-colors",
            activeTab === "left"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          {leftLabel}
        </button>
        <button
          onClick={() => setActiveTab("right")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium text-center transition-colors",
            activeTab === "right"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          {rightLabel}
        </button>
      </div>

      {/* Left panel */}
      <div
        className={cn(
          "border-r border-border flex flex-col overflow-hidden",
          leftWidth,
          activeTab === "left" ? "flex-1 md:flex-none" : "hidden md:flex"
        )}
      >
        {left}
      </div>

      {/* Right panel */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          activeTab === "right" ? "" : "hidden md:flex"
        )}
      >
        {right}
      </div>
    </div>
  );
}
