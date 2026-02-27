"use client";

import { Badge } from "@/components/ui/badge";
import type { Character } from "@/lib/types/project";

const ROLE_LABELS: Record<Character["role"], string> = {
  protagonist: "主角",
  antagonist: "反派",
  supporting: "配角",
  minor: "次要角色",
};

const ROLE_VARIANTS: Record<Character["role"], "default" | "secondary" | "destructive" | "outline"> = {
  protagonist: "default",
  antagonist: "destructive",
  supporting: "secondary",
  minor: "outline",
};

export function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="p-2.5 rounded-md border border-border bg-background">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm">{character.name}</span>
        <Badge variant={ROLE_VARIANTS[character.role]} className="text-xs">
          {ROLE_LABELS[character.role]}
        </Badge>
      </div>
      {character.description && (
        <p className="text-xs text-muted-foreground">{character.description}</p>
      )}
      {character.motivation && (
        <p className="text-xs text-muted-foreground mt-1">
          <span className="font-medium">动机：</span>
          {character.motivation}
        </p>
      )}
    </div>
  );
}
