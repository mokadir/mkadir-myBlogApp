import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    const adminRoutes = [
      "/admin",
      "/admin/analytics",
      "/admin/posts",
      "/admin/comments",
      "/admin/users",
      "/admin/categories",
      "/admin/settings",
    ];
    const writerRoutes = ["/dashboard/new", "/dashboard/[id]/edit"];
    const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

    // Redirect authenticated users away from auth pages
    if (token && authRoutes.some((route) => path.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Admin-only routes
    if (adminRoutes.some((route) => path.startsWith(route))) {
      if (!token || token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Writer+ routes (admin or writer can access)
    if (path.startsWith("/dashboard/new") || path.match(/\/dashboard\/.+\/edit/)) {
      if (!token || (token.role !== "ADMIN" && token.role !== "WRITER")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes
        const publicRoutes = [
          "/",
          "/posts",
          "/posts/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/api/auth",
          "/api/auth/",
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/forgot-password",
          "/api/auth/reset-password",
          "/api/auth/verify-email",
          "/_next",
          "/favicon.ico",
          "/images",
        ];

        // Allow public routes
        if (publicRoutes.some((route) => path.startsWith(route))) {
          return true;
        }

        // API routes protection
        if (path.startsWith("/api/")) {
          return !!token;
        }

        // Dashboard routes require auth
        if (path.startsWith("/dashboard") || path.startsWith("/profile")) {
          return !!token;
        }

        return true;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public images
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};