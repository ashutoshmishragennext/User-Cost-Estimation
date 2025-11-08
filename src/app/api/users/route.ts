import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { UserTable } from '@/drizzle/schema';

// GET all active users (for assignment dropdown)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view all users
    if (session.user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        role: UserTable.role,
        profilePic: UserTable.profilePic,
        isActive: UserTable.isActive,
      })
      .from(UserTable)
      .where(eq(UserTable.role, "USER"));

      

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}