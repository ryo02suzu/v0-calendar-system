import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const REALM = "DentalDashboard"

function decodeBasicToken(authorizationHeader: string | null): { username: string; password: string } | null {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return null
  }

  try {
    const encoded = authorizationHeader.split(" ")[1] ?? ""
    const decoded = Buffer.from(encoded, "base64").toString("utf8")
    const separatorIndex = decoded.indexOf(":")
    if (separatorIndex === -1) {
      return null
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch (error) {
    console.warn("[middleware] Failed to decode Authorization header", error)
    return null
  }
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  })
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // === IMPORTANT: skip middleware for API routes and next static assets ===
  // Client-side fetches to /api/* should not be blocked by Basic auth middleware.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next()
  }

  const requiredUser = process.env.DASHBOARD_BASIC_AUTH_USER
  const requiredPassword = process.env.DASHBOARD_BASIC_AUTH_PASSWORD

  // If credentials are not configured we skip the check to avoid blocking local dev,
  // but log a warning so operators know the app is running without protection.
  if (!requiredUser || !requiredPassword) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[middleware] Basic auth credentials are not configured. Set DASHBOARD_BASIC_AUTH_USER/PASSWORD.")
    }
    return NextResponse.next()
  }

  const credentials = decodeBasicToken(request.headers.get("authorization"))
  if (!credentials) {
    return unauthorizedResponse()
  }

  if (credentials.username !== requiredUser || credentials.password !== requiredPassword) {
    return unauthorizedResponse()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}