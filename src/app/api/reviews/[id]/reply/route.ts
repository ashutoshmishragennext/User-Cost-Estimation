// ====================================
// app/api/reviews/[id]/reply/route.ts
// ====================================

import { auth } from "@/auth";
import { TaskReviews, Tasks } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// POST/PUT - Add or update reply to review (User/Employee only)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only regular users (employees) can reply
    if (session.user.role === 'platform_admin') {
      return NextResponse.json(
        { error: 'Admins cannot reply to reviews. Only employees can reply.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reply } = body;

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply cannot be empty' },
        { status: 400 }
      );
    }

    // Get the review and check if it exists
    const review = await db
      .select({
        id: TaskReviews.id,
        taskId: TaskReviews.taskId,
      })
      .from(TaskReviews)
      .where(eq(TaskReviews.id, params.id))
      .limit(1);

    if (!review || review.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify the task belongs to this user
    const task = await db
      .select({ employeeId: Tasks.employeeId })
      .from(Tasks)
      .where(eq(Tasks.id, review[0].taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task[0].employeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only reply to reviews on your own tasks' },
        { status: 403 }
      );
    }

    // Update the review with the reply
    const [updatedReview] = await db
      .update(TaskReviews)
      .set({
        reply: reply.trim(),
        repliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(TaskReviews.id, params.id))
      .returning();

    return NextResponse.json({ review: updatedReview }, { status: 200 });

  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}

// DELETE - Remove reply (User/Employee only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'platform_admin') {
      return NextResponse.json(
        { error: 'Admins cannot delete replies' },
        { status: 403 }
      );
    }

    // Get the review
    const review = await db
      .select({ taskId: TaskReviews.taskId })
      .from(TaskReviews)
      .where(eq(TaskReviews.id, params.id))
      .limit(1);

    if (!review || review.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify the task belongs to this user
    const task = await db
      .select({ employeeId: Tasks.employeeId })
      .from(Tasks)
      .where(eq(Tasks.id, review[0].taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task[0].employeeId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete replies on your own tasks' },
        { status: 403 }
      );
    }

    // Remove the reply
    const [updatedReview] = await db
      .update(TaskReviews)
      .set({
        reply: null,
        repliedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(TaskReviews.id, params.id))
      .returning();

    return NextResponse.json(
      { message: 'Reply deleted successfully', review: updatedReview },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    );
  }
}