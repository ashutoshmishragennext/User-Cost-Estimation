// ====================================
// app/api/projects/[id]/route.ts
// ====================================

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { Projects, Tasks, UserTable } from '@/drizzle/schema';

// GET single project with tasks and employee details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project
    const project = await db
      .select({
        id: Projects.id,
        projectName: Projects.projectName,
        description: Projects.description,
        isActive: Projects.isActive,
        createdAt: Projects.createdAt,
        updatedAt: Projects.updatedAt,
      })
      .from(Projects)
      .where(eq(Projects.id, params.id))
      .limit(1);

    if (!project || project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all tasks for this project with employee details
    const tasks = await db
      .select({
        taskId: Tasks.id,
        taskName: Tasks.taskName,
        description: Tasks.description,
        expectedHours: Tasks.expectedHours,
        actualHours: Tasks.actualHours,
        status: Tasks.status,
        approvedAt: Tasks.approvedAt,
        createdAt: Tasks.createdAt,
        employeeId: UserTable.id,
        employeeName: UserTable.name,
        employeeEmail: UserTable.email,
      })
      .from(Tasks)
      .leftJoin(UserTable, eq(Tasks.employeeId, UserTable.id))
      .where(eq(Tasks.projectId, params.id));

    // Calculate summary
    const totalExpectedHours = tasks.reduce(
      (sum, task) => sum + parseFloat(task.expectedHours || '0'), 
      0
    );
    const totalActualHours = tasks.reduce(
      (sum, task) => sum + parseFloat(task.actualHours || '0'), 
      0
    );
    const variance = totalActualHours - totalExpectedHours;

    // Group tasks by employee (with null check)
    const employeeSummary = tasks.reduce((acc: any, task) => {
      const empId = task.employeeId || 'unknown';
      if (!acc[empId]) {
        acc[empId] = {
          employeeId: task.employeeId,
          employeeName: task.employeeName || 'Unknown',
          employeeEmail: task.employeeEmail || 'N/A',
          totalTasks: 0,
          totalExpectedHours: 0,
          totalActualHours: 0,
          pendingTasks: 0,
          approvedTasks: 0,
          rejectedTasks: 0,
        };
      }
      acc[empId].totalTasks += 1;
      acc[empId].totalExpectedHours += parseFloat(task.expectedHours || '0');
      acc[empId].totalActualHours += parseFloat(task.actualHours || '0');
      
      if (task.status === 'pending') acc[empId].pendingTasks += 1;
      if (task.status === 'approved') acc[empId].approvedTasks += 1;
      if (task.status === 'rejected') acc[empId].rejectedTasks += 1;
      
      return acc;
    }, {});

    return NextResponse.json({
      project: project[0],
      tasks,
      summary: {
        totalTasks: tasks.length,
        totalExpectedHours: totalExpectedHours.toFixed(2),
        totalActualHours: totalActualHours.toFixed(2),
        variance: variance.toFixed(2),
        variancePercentage: totalExpectedHours > 0 
          ? ((variance / totalExpectedHours) * 100).toFixed(2) 
          : '0',
      },
      employees: Object.values(employeeSummary),
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}

// PUT - Update project
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { projectName, description, isActive } = body;

    const [project] = await db
      .update(Projects)
      .set({
        projectName,
        description,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(Projects.id, params.id))
      .returning();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete project
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [project] = await db
      .update(Projects)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(Projects.id, params.id))
      .returning();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

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