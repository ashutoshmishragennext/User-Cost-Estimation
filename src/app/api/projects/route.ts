// app/api/projects/route.ts
import { db } from '@/lib/db'; // Your Drizzle DB instance

import { auth } from '@/lib/auth'; // Your auth function
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { Projects } from '@/drizzle/schema';

// GET all projects
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await db
      .select()
      .from(Projects)
      .where(eq(Projects.isActive, true))
      .orderBy(desc(Projects.createdAt));

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new project
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
    const { projectName, description } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(Projects)
      .values({
        projectName,
        description,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
