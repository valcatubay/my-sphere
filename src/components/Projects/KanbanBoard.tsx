import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, User, Calendar, Flag, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getCurrentUser, getUsers } from "@/lib/auth";
import { getTasks, createTask, updateTask, deleteTasks, type Task } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  projectId: string;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-muted' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-primary-light' },
  { id: 'in-review', title: 'In Review', color: 'bg-warning-light' },
  { id: 'done', title: 'Done', color: 'bg-success-light' },
] as const;

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { toast } = useToast();
  const user = getCurrentUser();
  const users = getUsers();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    assignedTo: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "unassigned",
  });

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = () => {
    const allTasks = getTasks().filter(task => task.projectId === projectId);
    setTasks(allTasks);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const task = createTask({
        ...newTask,
        assignedTo: newTask.assignedTo === "unassigned" ? "" : newTask.assignedTo,
        projectId,
        status: selectedColumn as Task['status'],
        createdBy: user.id,
      });
      
      setTasks(prev => [...prev, task]);
      setIsCreateDialogOpen(false);
      setNewTask({ title: "", description: "", priority: "medium", assignedTo: "unassigned" });
      
      toast({
        title: "Task created",
        description: `${task.title} has been added to ${COLUMNS.find(c => c.id === selectedColumn)?.title}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const updatedTask = updateTask(task.id, { status: destination.droppableId as Task['status'] });
    if (updatedTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast({
        title: "Task moved",
        description: `Task moved to ${COLUMNS.find(c => c.id === destination.droppableId)?.title}`,
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTasks([taskId]);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({
      title: "Task deleted",
      description: "Task has been removed successfully.",
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleFullViewOpen = () => {
    setIsTaskDialogOpen(false);
    setIsFullViewOpen(true);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-muted text-muted-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the project board.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the task"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") => 
                      setNewTask(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select
                    value={newTask.assignedTo}
                    onValueChange={(value) => 
                      setNewTask(prev => ({ ...prev, assignedTo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="column">Column</Label>
                <Select
                  value={selectedColumn}
                  onValueChange={setSelectedColumn}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Task details and quick actions
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description || "No description provided"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedTask.priority)}>
                    <Flag className="mr-1 h-3 w-3" />
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant="outline">
                    {COLUMNS.find(c => c.id === selectedTask.status)?.title}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4" />
                    {getUserName(selectedTask.assignedTo)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Created</Label>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(selectedTask.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleFullViewOpen}
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteTask(selectedTask.id);
                    setIsTaskDialogOpen(false);
                  }}
                >
                  Delete Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Task View Dialog */}
      <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Complete task information and management
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Description</Label>
                    <Card className="p-4">
                      <p className="text-sm leading-relaxed">
                        {selectedTask.description || "No description provided"}
                      </p>
                    </Card>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Comments</Label>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground">
                        Comments feature coming soon...
                      </p>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Card className="p-4 space-y-4">
                    <h3 className="font-semibold">Task Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge className="ml-2" variant="outline">
                          {COLUMNS.find(c => c.id === selectedTask.status)?.title}
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Priority</Label>
                        <Badge className={`ml-2 ${getPriorityColor(selectedTask.priority)}`}>
                          <Flag className="mr-1 h-3 w-3" />
                          {selectedTask.priority}
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Assigned To</Label>
                        <div className="flex items-center mt-1">
                          <User className="mr-2 h-4 w-4" />
                          <span className="text-sm">{getUserName(selectedTask.assignedTo)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Created By</Label>
                        <div className="flex items-center mt-1">
                          <User className="mr-2 h-4 w-4" />
                          <span className="text-sm">{getUserName(selectedTask.createdBy)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Created Date</Label>
                        <div className="flex items-center mt-1">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {new Date(selectedTask.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Eye className="mr-2 h-4 w-4" />
                        Edit Task
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full justify-start"
                        onClick={() => {
                          handleDeleteTask(selectedTask.id);
                          setIsFullViewOpen(false);
                        }}
                      >
                        Delete Task
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} rounded-lg p-3 mb-4`}>
                <h3 className="font-semibold text-center">
                  {column.title} ({getTasksByStatus(column.id).length})
                </h3>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 space-y-3 min-h-[200px]"
                  >
                    {getTasksByStatus(column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                         <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={(e) => {
                              // Only trigger if not clicking on dropdown menu
                              if (!(e.target as HTMLElement).closest('[role="menuitem"]') && 
                                  !(e.target as HTMLElement).closest('button')) {
                                handleTaskClick(task);
                              }
                            }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium line-clamp-2">
                                  {task.title}
                                </CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-destructive"
                                    >
                                      Delete Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <Badge className={getPriorityColor(task.priority)}>
                                  <Flag className="mr-1 h-3 w-3" />
                                  {task.priority}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <User className="mr-1 h-3 w-3" />
                                  {getUserName(task.assignedTo)}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}