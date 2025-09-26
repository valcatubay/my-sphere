import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProjects, type Project } from "@/lib/storage";
import KanbanBoard from "@/components/Projects/KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      const projects = getProjects();
      const foundProject = projects.find(p => p.id === id);
      setProject(foundProject || null);
    }
  }, [id]);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>
      <KanbanBoard projectId={project.id} />
    </div>
  );
}