import { NextResponse } from "next/server";
import { getUserFromRequest, canAccessEmailSettings, canAccessUserManagement } from "@/lib/auth";

export function middleware(request) {
  // Allow login page and static files
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/login") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const user = getUserFromRequest(request);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const pathname = request.nextUrl.pathname;

  // Email settings - SuperAdmin and Admin only
  if (pathname.startsWith("/email-settings")) {
    if (!canAccessEmailSettings(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // User management - SuperAdmin and Admin only
  if (pathname.startsWith("/users")) {
    if (!canAccessUserManagement(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/init-db).*)"],
};
