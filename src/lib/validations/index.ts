import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Projects ─────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  deadline: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: "Deadline cannot be in the past" }
    ),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Tasks ────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  assigneeId: z.string().optional().or(z.literal("")),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: "Due date cannot be in the past" }
    ),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
});

// ─── Members ──────────────────────────────────────────────────────────────

export const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]).default("TEAM_MEMBER"),
});

// ─── Comments ─────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

// ─── Pagination ───────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

// Exported types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
