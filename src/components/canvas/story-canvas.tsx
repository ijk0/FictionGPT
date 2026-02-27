"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CharacterCard } from "./character-card";
import { WorldPanel } from "./world-panel";
import { PlotTimeline } from "./plot-timeline";
import type { StoryCanvas as StoryCanvasType } from "@/lib/types/project";
import { BookOpen, Globe, Users, GitBranch, Palette } from "lucide-react";

interface StoryCanvasProps {
  canvas: StoryCanvasType | null;
}

export function StoryCanvas({ canvas }: StoryCanvasProps) {
  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        故事画布将随对话自动填充...
      </div>
    );
  }

  const hasContent =
    canvas.premise ||
    canvas.characters.length > 0 ||
    canvas.plotPoints.length > 0 ||
    canvas.setting?.location;

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        故事画布将随对话自动填充...
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {canvas.premise && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                故事概念
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{canvas.premise}</p>
              {canvas.genre && (
                <Badge variant="secondary" className="mt-2">
                  {canvas.genre}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {(canvas.setting?.location || canvas.setting?.timePeriod) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                世界观
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorldPanel setting={canvas.setting} />
            </CardContent>
          </Card>
        )}

        {canvas.characters.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                角色 ({canvas.characters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {canvas.characters.map((char) => (
                  <CharacterCard key={char.id} character={char} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {canvas.plotPoints.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                情节线
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlotTimeline plotPoints={canvas.plotPoints} />
            </CardContent>
          </Card>
        )}

        {canvas.themes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                主题
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {canvas.themes.map((theme, i) => (
                  <Badge key={i} variant="outline">
                    {theme}
                  </Badge>
                ))}
              </div>
              {canvas.tone && (
                <p className="text-xs text-muted-foreground mt-2">
                  基调：{canvas.tone}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
