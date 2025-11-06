import { NextResponse } from 'next/server';
import { pgTable, uuid, varchar, text, decimal, timestamp, index } from 'drizzle-orm/pg-core'; // your ORM imports
import { db } from '@/lib/db'; // your database connection
import { auth } from '@/lib/auth'; // your auth function
import { Tasks } from '@/drizzle/schema';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, taskName, description, expectedHours, actualHours } = body;

    // Basic validation
    if (!projectId || !taskName ||  actualHours == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert new task into DB
    const [newTask] = await db.insert(Tasks).values({
      projectId,
      employeeId: session.user.id!, // assigning task to logged-in user
      taskName,
      description: description || null,
      expectedHours: expectedHours || null,
      actualHours,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ task: newTask }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
