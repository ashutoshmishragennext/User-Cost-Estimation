// app/api/projects/route.ts
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { Projects, ProjectAssignments, UserTable } from '@/drizzle/schema';

// GET all projects with assigned users
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug logging
    console.log('User ID:', session.user.id);
    console.log('User Role:', session.user.role);
    console.log('Is Admin?', session.user.role === 'platform_admin');

    let projects;

    // If admin - show all projects
    if (session.user.role === 'platform_admin') {
      console.log('Fetching ALL projects for admin');
      
      projects = await db.query.Projects.findMany({
        where: eq(Projects.isActive, true),
        orderBy: [desc(Projects.createdAt)],
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    } else {
      // If regular user - show only assigned projects
      console.log('Fetching ASSIGNED projects for user');
      
      // First get project IDs assigned to this user
      const userAssignments = await db
        .select({ projectId: ProjectAssignments.projectId })
        .from(ProjectAssignments)
        .where(eq(ProjectAssignments.userId, session.user.id!));

      console.log('User assignments:', userAssignments);

      const projectIds = userAssignments.map(a => a.projectId);

      if (projectIds.length === 0) {
        console.log('No projects assigned to user');
        return NextResponse.json({ projects: [] }, { status: 200 });
      }

      // Fetch only assigned projects that are active
      projects = await db.query.Projects.findMany({
        where: and(
          inArray(Projects.id, projectIds),
          eq(Projects.isActive, true)
        ),
        orderBy: [desc(Projects.createdAt)],
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    }

    console.log('Returning projects count:', projects.length);
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project with optional user assignments
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create projects
    if (session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { projectName, description, assignedUserIds } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Validate assigned users if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      if (!Array.isArray(assignedUserIds)) {
        return NextResponse.json(
          { error: 'assignedUserIds must be an array' },
          { status: 400 }
        );
      }

      // Check if all users exist
      const users = await db
        .select({ id: UserTable.id })
        .from(UserTable)
        .where(inArray(UserTable.id, assignedUserIds));

      if (users.length !== assignedUserIds.length) {
        return NextResponse.json(
          { error: 'One or more users not found' },
          { status: 400 }
        );
      }
    }

    // Create project
    const [project] = await db
      .insert(Projects)
      .values({
        projectName,
        description: description ?? null,
        createdBy: session.user.id!,
      })
      .returning();

    // Assign users to project if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      const assignmentValues = assignedUserIds.map((userId: string) => ({
        projectId: project.id,
        userId,
        assignedBy: session.user.id!,
      }));

      await db
        .insert(ProjectAssignments)
        .values(assignmentValues);
    }

    // Fetch complete project data with assignments
    const completeProject = await db.query.Projects.findFirst({
      where: eq(Projects.id, project.id),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json({ project: completeProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}