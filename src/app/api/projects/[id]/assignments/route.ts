// app/api/projects/[projectId]/route.ts
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { Projects, Tasks, ProjectAssignments, UserTable } from '@/drizzle/schema';

// GET single project details with tasks and assignments
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch project with full details
    const project = await db.query.Projects.findFirst({
      where: eq(Projects.id, params.projectId),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        // ✅ Include assignments with user details
        assignments: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                profilePic: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    const isAdmin = session.user.role === 'platform_admin';
    const isAssigned = project.assignments?.some(a => a.userId === session.user.id);

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch tasks for this project
    const tasks = await db.query.Tasks.findMany({
      where: eq(Tasks.projectId, params.projectId),
      orderBy: [desc(Tasks.createdAt)],
      with: {
        employee: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate summary
    const totalTasks = tasks.length;
    const totalExpectedHours = tasks.reduce((sum, t:any) => sum + parseFloat(t.expectedHours), 0);
    const totalActualHours = tasks.reduce((sum, t:any) => sum + parseFloat(t.actualHours), 0);
    const variance = totalActualHours - totalExpectedHours;
    const variancePercentage = totalExpectedHours > 0 
      ? ((variance / totalExpectedHours) * 100).toFixed(2) 
      : '0';

    // Group by employees
    const employeeMap = new Map();
    tasks.forEach((task: any) => {
      const empId = task.employeeId;
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          employeeName: task.employee.name,
          employeeEmail: task.employee.email,
          totalTasks: 0,
          totalExpectedHours: 0,
          totalActualHours: 0,
          pendingTasks: 0,
          approvedTasks: 0,
          rejectedTasks: 0,
        });
      }

      const emp = employeeMap.get(empId);
      emp.totalTasks++;
      emp.totalExpectedHours += parseFloat(task.expectedHours);
      emp.totalActualHours += parseFloat(task.actualHours);
      
      if (task.status === 'pending') emp.pendingTasks++;
      if (task.status === 'approved') emp.approvedTasks++;
      if (task.status === 'rejected') emp.rejectedTasks++;
    });

    const employees = Array.from(employeeMap.values());

    // Format tasks
    const formattedTasks = tasks.map(task => ({
      taskId: task.id,
      taskName: task.taskName,
      description: task.description,
      expectedHours: task.expectedHours,
      actualHours: task.actualHours,
      status: task.status,
      approvedAt: task.approvedAt,
      createdAt: task.createdAt,
      employeeId: task.employeeId,
      employeeName: task.employee.name,
      employeeEmail: task.employee.email,
    }));

    return NextResponse.json({
      project: {
        ...project,
        // ✅ Assignments will be included here automatically from the query
      },
      tasks: formattedTasks,
      summary: {
        totalTasks,
        totalExpectedHours: totalExpectedHours.toFixed(2),
        totalActualHours: totalActualHours.toFixed(2),
        variance: variance.toFixed(2),
        variancePercentage,
      },
      employees,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

// DELETE project (soft delete)
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .update(Projects)
      .set({ isActive: false })
      .where(eq(Projects.id, params.projectId));

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

export async function POST(
//   req: Request,
//   { params }: { params: { projectId: string } }

  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.query.Projects.findFirst({
      where: eq(Projects.id, params.id),
    });
console.log(project, "projectssssssssssssssss")
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify users exist
    const users = await db
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(inArray(UserTable.id, userIds));

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: 'One or more users not found' },
        { status: 400 }
      );
    }

    // Check for existing assignments
    const existingAssignments = await db
      .select()
      .from(ProjectAssignments)
      .where(
        and(
          eq(ProjectAssignments.projectId, params.id),
          inArray(ProjectAssignments.userId, userIds)
        )
      );

    // Filter out already assigned users
    const existingUserIds = existingAssignments.map((a) => a.userId);
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { message: 'All users are already assigned to this project' },
        { status: 200 }
      );
    }

    // Create new assignments
    const assignmentValues = newUserIds.map((userId) => ({
      projectId: params.id,
      userId,
      assignedBy: session.user.id!,
    }));

    const assignments = await db
      .insert(ProjectAssignments)
      .values(assignmentValues)
      .returning();

    return NextResponse.json({ assignments }, { status: 201 });
  } catch (error) {
    console.error('Error adding assignments:', error);
    return NextResponse.json(
      { error: 'Failed to add assignments' },
      { status: 500 }
    );
  }
}