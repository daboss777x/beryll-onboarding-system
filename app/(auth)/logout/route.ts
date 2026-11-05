import { NextResponse, type NextRequest } from "next/server";
import { signOutCurrentUser } from "@/lib/data/auth";

/** POST /logout (use a <form method="post">). GET is not accepted, so links/prefetch can't sign users out. */
export async function POST(request: NextRequest) {
  await signOutCurrentUser();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
