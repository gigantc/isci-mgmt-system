import { prisma } from "@/lib/prisma";

// POST /api/user/recently-viewed - Add an ISCI code to user's recently viewed list
export async function action({ request }) {
  try {
    const { userId, isciCode } = await request.json();

    if (!userId || !isciCode) {
      return { success: false, message: "Missing userId or isciCode" };
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Parse recentlyViewed from JSON string
    let recentlyViewed = JSON.parse(user.recentlyViewed || "[]");

    // Remove the code if it already exists (to avoid duplicates)
    recentlyViewed = recentlyViewed.filter((code) => code !== isciCode);

    // Add the code to the beginning of the array
    recentlyViewed.unshift(isciCode);

    // Keep only the last 10 items
    recentlyViewed = recentlyViewed.slice(0, 10);

    // Update the user with the new recentlyViewed array
    await prisma.user.update({
      where: { id: userId },
      data: {
        recentlyViewed: JSON.stringify(recentlyViewed),
      },
    });

    return { success: true, recentlyViewed };
  } catch (error) {
    console.error("Error updating recently viewed:", error);
    return { success: false, message: error.message };
  }
}
