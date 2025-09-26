// Authentication and user management using localStorage

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'pm_current_user',
  USERS: 'pm_users',
} as const;

// Initialize default admin user if no users exist
const initializeUsers = () => {
  const users = getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: '1',
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
  }
};

export const getUsers = (): User[] => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const login = (email: string, password: string): User | null => {
  initializeUsers();
  const users = getUsers();
  
  // Simple authentication - in real app, you'd hash passwords
  const user = users.find(u => u.email === email && u.status === 'active');
  
  if (user) {
    // Update last login
    user.lastLogin = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  
  return null;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  const updatedUsers = [...users, newUser];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[userIndex]));
    }
    
    return users[userIndex];
  }
  
  return null;
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};