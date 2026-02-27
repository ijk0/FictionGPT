"use client";

import { Badge } from "@/components/ui/badge";
import type { PlotPoint } from "@/lib/types/project";

const TYPE_LABELS: Record<PlotPoint["type"], string> = {
  setup: "开端",
  rising: "发展",
  climax: "高潮",
  falling: "回落",
  resolution: "结局",
};

export function PlotTimeline({ plotPoints }: { plotPoints: PlotPoint[] }) {
  const ordered = [...plotPoints].sort((a, b) => {
    const order: PlotPoint["type"][] = [
      "setup",
      "rising",
      "climax",
      "falling",
      "resolution",
    ];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  return (
    <div className="space-y-2">
      {ordered.map((point) => (
        <div key={point.id} className="flex items-start gap-2">
          <div className="flex flex-col items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-px h-full bg-border" />
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{point.title}</span>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[point.type]}
              </Badge>
            </div>
            {point.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {point.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
