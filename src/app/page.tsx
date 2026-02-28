"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProjectCard } from "@/components/project/project-card";
import { StyleSelector } from "@/components/project/style-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { ProjectMeta, WritingStyle } from "@/lib/types/project";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<WritingStyle>("literary");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description, style }),
      });
      if (res.ok) {
        const project = await res.json();
        router.push(`/project/${project.id}/brainstorm`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">我的作品</h1>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-2" />
              新建作品
            </Button>
          </div>

          {showCreate && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>创建新作品</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    作品名称
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入作品名称..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    简介（可选）
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简单描述你的故事构想..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    写作风格
                  </label>
                  <StyleSelector value={style} onChange={setStyle} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!title.trim() || creating}
                  >
                    {creating ? "创建中..." : "开始创作"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-border bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : projects.length === 0 && !showCreate ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">还没有作品</p>
              <p className="text-sm">点击&quot;新建作品&quot;开始你的创作之旅</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
