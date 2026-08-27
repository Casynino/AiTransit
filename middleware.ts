import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { permissionForPath, ROLE_PERMISSIONS } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);

/**
 * First line of defence. Every /app route needs a session, and routes listed
 * in ROUTE_PERMISSIONS additionally need the permission. Server actions and
 * page loaders re-check independently — middleware alone is never the gate.
 */
/**
 * A hint, not a credential.
 *
 * The public site is statically generated and its header is a client
 * component, so it has no way to know whether the person reading it is signed
 * in — which is why its staff link said "Login" to somebody who was already
 * signed in, and why stepping out to the main site felt like being logged out.
 *
 * So the middleware leaves a flag the header can read. It says that somebody is
 * signed in and nothing else: no identity, no role, no token. It grants
 * nothing — every /app request is still checked against the real session below
 * — and the worst a stale one can do is show a link that bounces to the login
 * page, which is what happens without it anyway.
 *
 * Readable by scripts on purpose. The session cookie stays httpOnly.
 */
/* Namespaced for the same reason as the auth cookies above — see the note
   on `cookies` in auth.config.ts. "tx.staff" was Target Express's name and
   would have collided with it on localhost. */
const STAFF_HINT = "aitransit.staff";

function withHint(res: NextResponse, signedIn: boolean) {
  if (signedIn) {
    res.cookies.set(STAFF_HINT, "1", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12, // the session's own life — see auth.config.ts
    });
  } else {
    res.cookies.delete(STAFF_HINT);
  }
  return res;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isInternal = pathname.startsWith("/app");
  const isPortal = pathname.startsWith("/portal");
  const isLogin = pathname === "/login";

  /* One login page, two destinations. A customer and a member of staff sign in
     through the same credentials provider against the same User table, and the
     role is what decides which building they end up in. Doing it here rather
     than on the login page means a customer who bookmarked /app/dashboard is
     redirected before any staff layout renders. */
  const home = session?.user?.role === "CUSTOMER" ? "/portal" : "/app/dashboard";

  if (isLogin && session?.user) {
    return withHint(NextResponse.redirect(new URL(home, req.nextUrl)), true);
  }

  // Arriving at the login page without a session is the clearest signal there
  // is that the hint is stale. Signing out lands here.
  if (isLogin) return withHint(NextResponse.next(), false);

  if (!isInternal && !isPortal) return NextResponse.next();

  if (!session?.user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return withHint(NextResponse.redirect(url), false);
  }

  /*
    THE TWO BUILDINGS DO NOT CONNECT.

    A customer cannot walk into /app and a member of staff has nothing in
    /portal — a portal page resolves the session to a Customer record, and staff
    accounts have none. Both are redirects rather than errors: neither is a
    security event, and the route guard below is not what protects /app anyway.
    Every staff page re-checks its own permission, and role CUSTOMER holds none
    of them, so a customer reaching a staff URL would be refused twice over.
  */
  if (isInternal && session.user.role === "CUSTOMER") {
    return withHint(NextResponse.redirect(new URL("/portal", req.nextUrl)), true);
  }
  if (isPortal && session.user.role !== "CUSTOMER") {
    return withHint(
      NextResponse.redirect(new URL("/app/dashboard", req.nextUrl)),
      true
    );
  }
  if (isPortal) return withHint(NextResponse.next(), true);

  const required = permissionForPath(pathname);
  if (required) {
    const role = session.user.role;
    const granted = role ? ROLE_PERMISSIONS[role] ?? [] : [];
    if (!granted.includes(required)) {
      return withHint(
        NextResponse.redirect(new URL("/app/no-access", req.nextUrl)),
        true
      );
    }
  }

  return withHint(NextResponse.next(), true);
});

export const config = {
  matcher: ["/app/:path*", "/portal/:path*", "/login"],
};
