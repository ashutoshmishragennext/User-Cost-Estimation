// ====================================
// app/api/reviews/route.ts
// ====================================

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { TaskReviews, Tasks, UserTable } from '@/drizzle/schema';

// GET - Get reviews by taskId (query param)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Get all reviews for this task with reviewer details
    const reviews = await db
      .select({
        id: TaskReviews.id,
        taskId: TaskReviews.taskId,
        reviewerId: TaskReviews.reviewerId,
        reviewerType: TaskReviews.reviewerType,
        rating: TaskReviews.rating,
        feedback: TaskReviews.feedback,
        reply: TaskReviews.reply,
        repliedAt: TaskReviews.repliedAt,
        createdAt: TaskReviews.createdAt,
        updatedAt: TaskReviews.updatedAt,
        reviewerName: UserTable.name,
        reviewerEmail: UserTable.email,
      })
      .from(TaskReviews)
      .leftJoin(UserTable, eq(TaskReviews.reviewerId, UserTable.id))
      .where(eq(TaskReviews.taskId, taskId))
      .orderBy(desc(TaskReviews.createdAt));

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2)
      : '0';

    return NextResponse.json({
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRating,
        adminReviews: reviews.filter(r => r.reviewerType === 'admin').length,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review (Admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only platform_admin can create reviews
    if (session.user.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Only admins can create reviews' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { taskId, rating, feedback } = body;

    // Validate
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if task exists
    const task = await db
      .select({ id: Tasks.id })
      .from(Tasks)
      .where(eq(Tasks.id, taskId))
      .limit(1);

    if (!task || task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
if (!session?.user?.id) {
  throw new Error("Reviewer ID is missing from session");
}


    // Check if admin already reviewed this task
    const existingReview = await db
      .select({ id: TaskReviews.id })
      .from(TaskReviews)
      .where(
        and(
          eq(TaskReviews.taskId, taskId),
          eq(TaskReviews.reviewerId, session.user.id)
        )
      )
      .limit(1);

    if (existingReview && existingReview.length > 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this task' },
        { status: 400 }
      );
    }

    // Create review
    const [review] = await db
      .insert(TaskReviews)
      .values({
        taskId,
        reviewerId: session.user.id!,
        reviewerType: 'admin',
        rating,
        feedback: feedback || null,
      })
      .returning();

    return NextResponse.json({ review }, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

