import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, isAdmin, getUsers } from "@/lib/auth";
import { getProjects, getTasks, getDocuments } from "@/lib/storage";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    documents: 0,
    users: 0,
    myTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const projects = getProjects();
    const tasks = getTasks();
    const documents = getDocuments();
    const users = getUsers();

    const myTasks = tasks.filter(t => t.assignedTo === user?.id);
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const completedTasks = tasks.filter(t => t.status === 'done');

    setStats({
      totalProjects: projects.length,
      activeTasks: activeTasks.length,
      documents: documents.length,
      users: users.length,
      myTasks: myTasks.filter(t => t.status !== 'done').length,
      completedTasks: completedTasks.length,
    });
  }, [user?.id]);

  const recentProjects = getProjects()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const myRecentTasks = getTasks()
    .filter(t => t.assignedTo === user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-muted text-muted-foreground';
      case 'in-progress': return 'bg-primary-light text-primary';
      case 'in-review': return 'bg-warning-light text-warning';
      case 'done': return 'bg-success-light text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-muted text-muted-foreground';
      case 'medium': return 'bg-primary-light text-primary';
      case 'high': return 'bg-warning-light text-warning';
      case 'urgent': return 'bg-destructive-light text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good morning, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/projects')}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary-light to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Active workspaces</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-success-light to-success/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.myTasks}</div>
            <p className="text-xs text-muted-foreground">Assigned to me</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-warning-light to-warning/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.documents}</div>
            <p className="text-xs text-muted-foreground">Knowledge base</p>
          </CardContent>
        </Card>

        {userIsAdmin && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-accent to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.users}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Recent Projects
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/projects')}
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 capitalize">
                    {project.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No projects yet. Create your first project to get started!
              </p>
            )}
          </CardContent>
        </Card>

        {/* My Recent Tasks */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                My Recent Tasks
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/projects')}
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRecentTasks.length > 0 ? (
              myRecentTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No tasks assigned to you yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}