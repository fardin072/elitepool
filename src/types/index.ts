export type Role = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: Date | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number; members: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  assigneeId: string | null;
  dueDate: Date | null;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  assignee?: User | null;
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: { comments: number; attachments: number };
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: Role;
  joinedAt: Date;
  user?: User;
  project?: Project;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  s3Key: string;
  name: string;
  size: number;
  mimeType: string | null;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  projectId: string | null;
  createdAt: Date;
  user?: User;
}

// Dashboard aggregates
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  avatar: string | null;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter/search params
export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  search?: string;
  overdue?: boolean;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
}
