"use client";

import type { WorldSetting } from "@/lib/types/project";

export function WorldPanel({ setting }: { setting: WorldSetting }) {
  return (
    <div className="space-y-1.5 text-sm">
      {setting.timePeriod && (
        <div>
          <span className="text-muted-foreground">时代：</span>
          {setting.timePeriod}
        </div>
      )}
      {setting.location && (
        <div>
          <span className="text-muted-foreground">地点：</span>
          {setting.location}
        </div>
      )}
      {setting.atmosphere && (
        <div>
          <span className="text-muted-foreground">氛围：</span>
          {setting.atmosphere}
        </div>
      )}
      {setting.rules && (
        <div>
          <span className="text-muted-foreground">规则：</span>
          {setting.rules}
        </div>
      )}
    </div>
  );
}
