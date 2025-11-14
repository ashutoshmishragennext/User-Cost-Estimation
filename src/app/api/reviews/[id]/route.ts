// ====================================
// app/api/reviews/[id]/route.ts
// ====================================

import { auth } from "@/auth";
import { TaskReviews, UserTable } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET single review
export async function GET(
  req: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await db
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
      .where(eq(TaskReviews.id, params.reviewId))
      .limit(1);

    if (!review || review.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review: review[0] }, { status: 200 });

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT - Update review (Admin only - can update their own review)
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
      return NextResponse.json(
        { error: 'Only admins can update reviews' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rating, feedback } = body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to this admin
    const existingReview = await db
      .select({ reviewerId: TaskReviews.reviewerId })
      .from(TaskReviews)
      .where(eq(TaskReviews.id, params.id))
      .limit(1);

    if (!existingReview || existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview[0].reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own reviews' },
        { status: 403 }
      );
    }

    // Update review
    const [review] = await db
      .update(TaskReviews)
      .set({
        rating: rating || undefined,
        feedback: feedback !== undefined ? feedback : undefined,
        updatedAt: new Date(),
      })
      .where(eq(TaskReviews.id, params.id))
      .returning();

    return NextResponse.json({ review }, { status: 200 });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE - Delete review (Admin only - can delete their own review)
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
      return NextResponse.json(
        { error: 'Only admins can delete reviews' },
        { status: 403 }
      );
    }

    // Check if review exists and belongs to this admin
    const existingReview = await db
      .select({ reviewerId: TaskReviews.reviewerId })
      .from(TaskReviews)
      .where(eq(TaskReviews.id, params.id))
      .limit(1);

    if (!existingReview || existingReview.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview[0].reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete review
    await db
      .delete(TaskReviews)
      .where(eq(TaskReviews.id, params.id));

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
