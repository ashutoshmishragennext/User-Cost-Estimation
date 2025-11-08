import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  serial,
} from "drizzle-orm/pg-core";

// =====================
// Enums
// =====================

export const UserRole = pgEnum("user_role", [
  "USER",
  "platform_admin"
]);

export const TicketStatusEnum = pgEnum('ticket_status', ['open', 'pending', 'resolved', 'closed']);
export const MessageDirectionEnum = pgEnum('message_direction', ['user_to_admin', 'admin_to_user']);
export const TaskStatusEnum = pgEnum('task_status', ['pending', 'approved', 'rejected']);

// =====================
// Ticket Tables
// =====================
export const EmailVerificationTokenTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    emailTokenKey: uniqueIndex("email_verification_tokens_email_token_key").on(
      table.email,
      table.token
    ),
    tokenKey: uniqueIndex("email_verification_tokens_token_key").on(
      table.token
    ),
  })
);

export const PasswordResetTokenTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (table) => ({
    emailTokenKey: uniqueIndex("password_reset_tokens_email_token_key").on(
      table.email,
      table.token
    ),
    tokenKey: uniqueIndex("password_reset_tokens_token_key").on(table.token),
  })
);

export const UserTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    emailVerifToken: varchar("email_verif_token", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
    mobile: text("mobile"),
    role: UserRole("role").default("USER").notNull(),
    profilePic: text("profile_pic"),
    
    // Additional fields from new schema
    phone: varchar('phone', { length: 15 }).unique(),
    userType: UserRole('user_type'),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    isActive: boolean('is_active').default(true),
    isVerified: boolean('is_verified').default(false),
    emailVerifiedAt: timestamp('email_verified_at'),
    phoneVerifiedAt: timestamp('phone_verified_at'),
    lastLoginAt: timestamp('last_login_at'),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    twoFactorSecret: varchar('two_factor_secret', { length: 32 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailKey: uniqueIndex("users_email_key").on(table.email),
    nameEmailIdx: index("users_name_email_idx").on(table.name, table.email),
  })
);


// export const UserRelations = relations(UserTable, ({ many }) => ({
//   createdTickets: many(Tickets, { relationName: 'user_tickets' }),
//   assignedTickets: many(Tickets, { relationName: 'assigned_admin' }),
//   sentMessages: many(TicketMessages),
// }));

export const Projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => UserTable.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdByIdx: index('project_created_by_idx').on(table.createdBy),
  projectNameIdx: index('project_name_idx').on(table.projectName),
}));

export const Tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => Projects.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => UserTable.id),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),
  expectedHours: decimal('expected_hours', { precision: 10, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 10, scale: 2 }),
  status: TaskStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => UserTable.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('task_project_idx').on(table.projectId),
  employeeIdx: index('task_employee_idx').on(table.employeeId),
  statusIdx: index('task_status_idx').on(table.status),
  approvedByIdx: index('task_approved_by_idx').on(table.approvedBy),
}));


// Add this new table to your schema.ts
export const ProjectAssignments = pgTable('project_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => Projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  assignedBy: uuid('assigned_by').notNull().references(() => UserTable.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => ({
  projectUserIdx: uniqueIndex('project_user_unique_idx').on(table.projectId, table.userId),
  projectIdx: index('project_assignment_project_idx').on(table.projectId),
  userIdx: index('project_assignment_user_idx').on(table.userId),
}));

// Update ProjectRelations to include assignments
export const ProjectRelations = relations(Projects, ({ one, many }) => ({
  creator: one(UserTable, {
    fields: [Projects.createdBy],
    references: [UserTable.id],
  }),
  tasks: many(Tasks),
  assignments: many(ProjectAssignments), // Add this line
}));

// Add ProjectAssignmentRelations
export const ProjectAssignmentRelations = relations(ProjectAssignments, ({ one }) => ({
  project: one(Projects, {
    fields: [ProjectAssignments.projectId],
    references: [Projects.id],
  }),
  user: one(UserTable, {
    fields: [ProjectAssignments.userId],
    references: [UserTable.id],
    relationName: 'assigned_projects',
  }),
  assigner: one(UserTable, {
    fields: [ProjectAssignments.assignedBy],
    references: [UserTable.id],
    relationName: 'assigned_by_user',
  }),
}));

// Update UserRelations to include project assignments
// export const UserRelations = relations(UserTable, ({ many }) => ({
//   createdProjects: many(Projects),
//   employeeTasks: many(Tasks, { relationName: 'employee_tasks' }),
//   approvedTasks: many(Tasks, { relationName: 'approved_tasks' }),
//   assignedProjects: many(ProjectAssignments, { relationName: 'assigned_projects' }), // Add this
//   projectsAssignedByMe: many(ProjectAssignments, { relationName: 'assigned_by_user' }), // Add this
// }));

// export const ProjectRelations = relations(Projects, ({ one, many }) => ({
//   creator: one(UserTable, {
//     fields: [Projects.createdBy],
//     references: [UserTable.id],
//   }),
//   tasks: many(Tasks),
// }));

export const TaskRelations = relations(Tasks, ({ one }) => ({
  project: one(Projects, {
    fields: [Tasks.projectId],
    references: [Projects.id],
  }),
  employee: one(UserTable, {
    fields: [Tasks.employeeId],
    references: [UserTable.id],
    relationName: 'employee_tasks',
  }),
  approver: one(UserTable, {
    fields: [Tasks.approvedBy],
    references: [UserTable.id],
    relationName: 'approved_tasks',
  }),
}));

// Update UserRelations to include projects and tasks
export const UserRelations = relations(UserTable, ({ many }) => ({
  createdProjects: many(Projects),
  employeeTasks: many(Tasks, { relationName: 'employee_tasks' }),
  approvedTasks: many(Tasks, { relationName: 'approved_tasks' }),
}));
