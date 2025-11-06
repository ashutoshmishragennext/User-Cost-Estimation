
// ====================================
// app/api/tasks/[id]/route.ts
// ====================================

import { db } from '@/lib/db';
// import { Tasks, UserTable, Projects } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { Tasks, Projects, UserTable } from '@/drizzle/schema';

// GET single task
// export async function GET(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await auth();
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get project
//     const project = await db
//       .select({
//         id: Projects.id,
//         projectName: Projects.projectName,
//         description: Projects.description,
//         isActive: Projects.isActive,
//         createdAt: Projects.createdAt,
//         updatedAt: Projects.updatedAt,
//       })
//       .from(Projects)
//       .where(eq(Projects.id, params.id))
//       .limit(1);

//     if (!project || project.length === 0) {
//       return NextResponse.json({ error: 'Project not found' }, { status: 404 });
//     }

//     // ✅ Get only tasks for the current logged-in user
//     const tasks = await db
//       .select({
//         taskId: Tasks.id,
//         taskName: Tasks.taskName,
//         description: Tasks.description,
//         expectedHours: Tasks.expectedHours,
//         actualHours: Tasks.actualHours,
//         status: Tasks.status,
//         approvedAt: Tasks.approvedAt,
//         createdAt: Tasks.createdAt,
//         employeeId: UserTable.id,
//         employeeName: UserTable.name,
//         employeeEmail: UserTable.email,
//       })
//       .from(Tasks)
//       .leftJoin(UserTable, eq(Tasks.employeeId, UserTable.id))
//       .where(
//         and(
//           eq(Tasks.projectId, params.id),
//           eq(Tasks.employeeId, session.user.id) // ✅ Filter by current user
//         )
//       );

//     // Calculate summary
//     const totalExpectedHours = tasks.reduce(
//       (sum, task) => sum + parseFloat(task.expectedHours || '0'), 
//       0
//     );
//     const totalActualHours = tasks.reduce(
//       (sum, task) => sum + parseFloat(task.actualHours || '0'), 
//       0
//     );
//     const variance = totalActualHours - totalExpectedHours;

//     // Group tasks by employee (with null check)
//     const employeeSummary = tasks.reduce((acc: any, task) => {
//       const empId = task.employeeId || 'unknown';
//       if (!acc[empId]) {
//         acc[empId] = {
//           employeeId: task.employeeId,
//           employeeName: task.employeeName || 'Unknown',
//           employeeEmail: task.employeeEmail || 'N/A',
//           totalTasks: 0,
//           totalExpectedHours: 0,
//           totalActualHours: 0,
//           pendingTasks: 0,
//           approvedTasks: 0,
//           rejectedTasks: 0,
//         };
//       }
//       acc[empId].totalTasks += 1;
//       acc[empId].totalExpectedHours += parseFloat(task.expectedHours || '0');
//       acc[empId].totalActualHours += parseFloat(task.actualHours || '0');
      
//       if (task.status === 'pending') acc[empId].pendingTasks += 1;
//       if (task.status === 'approved') acc[empId].approvedTasks += 1;
//       if (task.status === 'rejected') acc[empId].rejectedTasks += 1;
      
//       return acc;
//     }, {});

//     return NextResponse.json({
//       project: project[0],
//       tasks,
//       summary: {
//         totalTasks: tasks.length,
//         totalExpectedHours: totalExpectedHours.toFixed(2),
//         totalActualHours: totalActualHours.toFixed(2),
//         variance: variance.toFixed(2),
//         variancePercentage: totalExpectedHours > 0 
//           ? ((variance / totalExpectedHours) * 100).toFixed(2) 
//           : '0',
//       },
//       employees: Object.values(employeeSummary),
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Error fetching project details:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch project details' },
//       { status: 500 }
//     );
//   }
// }

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

    // ✅ Get only tasks for the current logged-in user
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
      .where(
        and(
          eq(Tasks.projectId, params.id),
          eq(Tasks.employeeId, session.user.id!) // ✅ Filter by current user
        )
      );

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
// PUT - Update task
// export async function PUT(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const session = await auth();
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { taskName, description, expectedHours, actualHours } = body;

//     // Check if task exists and belongs to user
//     const [existingTask] = await db
//       .select()
//       .from(Tasks)
//       .where(eq(Tasks.id, params.id))
//       .limit(1);

//     if (!existingTask) {
//       return NextResponse.json({ error: 'Task not found' }, { status: 404 });
//     }

//     // Only employee who created task can edit (if not approved yet)
//     if (
//       existingTask.employeeId !== session.user.id &&
//       session.user.role !== 'platform_admin'
//     ) {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     // Cannot edit approved tasks (unless admin)
//     if (
//       existingTask.status !== 'pending' &&
//       session.user.role !== 'platform_admin'
//     ) {
//       return NextResponse.json(
//         { error: 'Cannot edit approved/rejected tasks' },
//         { status: 403 }
//       );
//     }

//     const [task] = await db
//       .update(Tasks)
//       .set({
//         taskName,
//         description,
//         expectedHours: expectedHours?.toString(),
//         actualHours: actualHours?.toString(),
//         updatedAt: new Date(),
//       })
//       .where(eq(Tasks.id, params.id))
//       .returning();

//     return NextResponse.json({ task }, { status: 200 });
//   } catch (error) {
//     console.error('Error updating task:', error);
//     return NextResponse.json(
//       { error: 'Failed to update task' },
//       { status: 500 }
//     );
//   }
// }
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskName, description, expectedHours, status } = body;

    // Validate required fields
    if (!taskName?.trim()) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    if (expectedHours !== undefined && (isNaN(parseFloat(expectedHours)) || parseFloat(expectedHours) < 0)) {
      return NextResponse.json({ error: 'Actual hours must be a positive number' }, { status: 400 });
    }

    // Validate status if provided
    if (status !== undefined && !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(Tasks)
      .where(eq(Tasks.id, params.id))
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'platform_admin';

    // Only employee who created task or admin can edit
    if (existingTask.employeeId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only admin can change status
    if (status !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can change task status' },
        { status: 403 }
      );
    }

    // Cannot edit approved/rejected tasks (unless admin)
    if (existingTask.status !== 'pending' && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot edit approved/rejected tasks' },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: any = {
      taskName: taskName.trim(),
      description: description?.trim() || null,
      expectedHours: expectedHours?.toString(),
      updatedAt: new Date(),
    };

    // Admin can update status
    if (isAdmin && status !== undefined) {
      updateData.status = status;
      
      // Set approval metadata when status changes
      if (status === 'approved') {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date();
        updateData.rejectionReason = null;
      } else if (status === 'rejected') {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date();
        // You can add rejectionReason from body if needed
        // updateData.rejectionReason = body.rejectionReason || null;
      } else if (status === 'pending') {
        // Reset approval fields if reverting to pending
        updateData.approvedBy = null;
        updateData.approvedAt = null;
        updateData.rejectionReason = null;
      }
    }

    const [task] = await db
      .update(Tasks)
      .set(updateData)
      .where(eq(Tasks.id, params.id))
      .returning();

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
// DELETE task
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if task exists
    const [existingTask] = await db
      .select()
      .from(Tasks)
      .where(eq(Tasks.id, params.id))
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only employee who created task or admin can delete
    if (
      existingTask.employeeId !== session.user.id &&
      session.user.role !== 'platform_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(Tasks).where(eq(Tasks.id, params.id));

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
