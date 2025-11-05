import { auth } from "@/auth";

// Helper function to get the currently logged-in user in a server component.
export async function currentUser() {
  try {
    const session = await auth();
    return session?.user;
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}

// Helper function to get the role of currently logged-in user in a client component.
export async function currentRole() {
  try {
    const session = await auth();
    return session?.user.role;
  } catch (err) {
    console.error("Error fetching current role:", err);
  }
}

export { auth };
