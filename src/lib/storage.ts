// Data models and storage management

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[]; // user IDs
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface Comment {
  id: string;
  parentId: string; // project, task, or document ID
  parentType: 'project' | 'task' | 'document';
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

const STORAGE_KEYS = {
  PROJECTS: 'pm_projects',
  TASKS: 'pm_tasks',
  COMMENTS: 'pm_comments',
  DOCUMENTS: 'pm_documents',
} as const;

// Generic storage functions
export const getStorageData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setStorageData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Projects
export const getProjects = (): Project[] => getStorageData<Project>(STORAGE_KEYS.PROJECTS);
export const setProjects = (projects: Project[]): void => setStorageData(STORAGE_KEYS.PROJECTS, projects);

export const createProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  setProjects([...projects, newProject]);
  return newProject;
};

export const updateProject = (id: string, updates: Partial<Project>): Project | null => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
    setProjects(projects);
    return projects[index];
  }
  
  return null;
};

export const deleteProject = (id: string): boolean => {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  
  if (filtered.length !== projects.length) {
    setProjects(filtered);
    // Also delete related tasks, comments, and documents
    deleteTasks(getTasks().filter(t => t.projectId === id).map(t => t.id));
    deleteComments(getComments().filter(c => c.parentId === id).map(c => c.id));
    deleteDocuments(getDocuments().filter(d => d.projectId === id).map(d => d.id));
    return true;
  }
  
  return false;
};

// Tasks
export const getTasks = (): Task[] => getStorageData<Task>(STORAGE_KEYS.TASKS);
export const setTasks = (tasks: Task[]): void => setStorageData(STORAGE_KEYS.TASKS, tasks);

export const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  setTasks([...tasks, newTask]);
  return newTask;
};

export const updateTask = (id: string, updates: Partial<Task>): Task | null => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
    setTasks(tasks);
    return tasks[index];
  }
  
  return null;
};

export const deleteTasks = (ids: string[]): void => {
  const tasks = getTasks();
  const filtered = tasks.filter(t => !ids.includes(t.id));
  setTasks(filtered);
  
  // Also delete related comments
  const taskComments = getComments().filter(c => c.parentType === 'task' && ids.includes(c.parentId));
  deleteComments(taskComments.map(c => c.id));
};

// Comments
export const getComments = (): Comment[] => getStorageData<Comment>(STORAGE_KEYS.COMMENTS);
export const setComments = (comments: Comment[]): void => setStorageData(STORAGE_KEYS.COMMENTS, comments);

export const createComment = (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Comment => {
  const comments = getComments();
  const newComment: Comment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  setComments([...comments, newComment]);
  return newComment;
};

export const updateComment = (id: string, updates: Partial<Comment>): Comment | null => {
  const comments = getComments();
  const index = comments.findIndex(c => c.id === id);
  
  if (index !== -1) {
    comments[index] = { ...comments[index], ...updates, updatedAt: new Date().toISOString() };
    setComments(comments);
    return comments[index];
  }
  
  return null;
};

export const deleteComments = (ids: string[]): void => {
  const comments = getComments();
  const filtered = comments.filter(c => !ids.includes(c.id));
  setComments(filtered);
};

// Documents
export const getDocuments = (): Document[] => getStorageData<Document>(STORAGE_KEYS.DOCUMENTS);
export const setDocuments = (documents: Document[]): void => setStorageData(STORAGE_KEYS.DOCUMENTS, documents);

export const createDocument = (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Document => {
  const documents = getDocuments();
  const newDocument: Document = {
    ...document,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  
  setDocuments([...documents, newDocument]);
  return newDocument;
};

export const updateDocument = (id: string, updates: Partial<Document>): Document | null => {
  const documents = getDocuments();
  const index = documents.findIndex(d => d.id === id);
  
  if (index !== -1) {
    const currentVersion = documents[index].version;
    documents[index] = { 
      ...documents[index], 
      ...updates, 
      updatedAt: new Date().toISOString(),
      version: updates.status === 'published' ? currentVersion + 1 : currentVersion
    };
    setDocuments(documents);
    return documents[index];
  }
  
  return null;
};

export const deleteDocuments = (ids: string[]): void => {
  const documents = getDocuments();
  const filtered = documents.filter(d => !ids.includes(d.id));
  setDocuments(filtered);
  
  // Also delete related comments
  const docComments = getComments().filter(c => c.parentType === 'document' && ids.includes(c.parentId));
  deleteComments(docComments.map(c => c.id));
};