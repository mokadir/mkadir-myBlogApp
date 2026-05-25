import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewFollower } from "@/lib/notifications/notification-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 }
      );
    }

    if (followingId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({ following: false });
    }

    // Follow
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId,
      },
    });

    // Notify
    await notifyNewFollower({
      followerId: session.user.id,
      followedUserId: followingId,
      followerName: session.user.name || "Someone",
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { error: "Failed to process follow" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const type = searchParams.get("type") || "following"; // following | followers | check

    if (type === "check") {
      const targetId = searchParams.get("targetId");
      if (!targetId) {
        return NextResponse.json({ following: false });
      }

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetId,
          },
        },
      });

      return NextResponse.json({ following: !!follow });
    }

    if (type === "followers") {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        followers: followers.map((f) => f.follower),
        count: followers.length,
      });
    }

    // Following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      following: following.map((f) => f.following),
      count: following.length,
    });
  } catch (error) {
    console.error("Get follows error:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows" },
      { status: 500 }
    );
  }
}
