"use client";

import type { WritingStyle } from "@/lib/types/project";

const STYLE_OPTIONS: { value: WritingStyle; label: string; desc: string }[] = [
  { value: "literary", label: "严肃文学", desc: "注重文学性和主题深度" },
  { value: "webnovel", label: "网络小说", desc: "节奏明快、爽点密集" },
  { value: "mystery", label: "悬疑推理", desc: "布局精巧、层层揭秘" },
  { value: "scifi", label: "科幻", desc: "科学设定严谨、想象丰富" },
  { value: "fantasy", label: "奇幻", desc: "宏大世界观、魔法体系" },
  { value: "romance", label: "言情", desc: "情感细腻、甜虐交织" },
  { value: "erotic", label: "情色", desc: "大胆露骨、感官描写细腻" },
  { value: "dark", label: "暗黑", desc: "阴暗题材、道德灰色地带" },
  { value: "harem", label: "后宫", desc: "多线感情、众美环绕" },
  { value: "custom", label: "自定义", desc: "自定义写作风格" },
];

interface StyleSelectorProps {
  value: WritingStyle;
  onChange: (value: WritingStyle) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`p-3 rounded-lg border text-left transition-colors ${
            value === option.value
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="font-medium text-sm">{option.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {option.desc}
          </div>
        </button>
      ))}
    </div>
  );
}
