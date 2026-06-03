import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import {
  getAlerts,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../../lib/alertStore";

// GET /api/alerts — returns all alerts + unread count
export async function GET(request: Request) {
  const result = await validateToken(request);
  if (!result.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    alerts: getAlerts(),
    unreadCount: getUnreadCount(),
  });
}

// PATCH /api/alerts — mark alerts as read
// body: { id: string }  → mark one
// body: { all: true }   → mark all
export async function PATCH(request: Request) {
  const result = await validateToken(request);
  if (!result.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.all) {
    markAllAsRead();
  } else if (body.id) {
    markAsRead(body.id);
  }

  return NextResponse.json({ unreadCount: getUnreadCount() });
}
