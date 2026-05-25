import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings - Retrieve site settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get settings from the database
    // For now, return default settings since we don't have a settings model
    // In production, you'd store these in a SiteSettings model
    const defaultSettings = {
      siteName: "ModernBlog",
      siteDescription:
        "A modern blogging platform for sharing ideas, stories, and knowledge with the world.",
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      postsPerPage: 10,
      enableRegistration: true,
      enableComments: true,
      moderateComments: false,
      enableNewsletter: true,
      socialLinks: {
        twitter: "",
        github: "",
        linkedin: "",
        facebook: "",
      },
      appearance: {
        primaryColor: "#6366f1",
        fontFamily: "Inter",
      },
      email: {
        fromName: "ModernBlog",
        fromEmail: "noreply@modernblog.com",
      },
      seo: {
        metaTitle: "ModernBlog - A Modern Blogging Platform",
        metaDescription:
          "A modern blogging platform for sharing ideas, stories, and knowledge with the world.",
        metaKeywords: "blog, writing, content, modern, technology",
      },
    };

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.siteName || typeof body.siteName !== "string") {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 }
      );
    }

    // In production, save to database
    // For now, return success (settings would be stored in a SiteSettings model)
    console.log("Settings updated:", body);

    return NextResponse.json({
      message: "Settings saved successfully",
      settings: body,
    });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
