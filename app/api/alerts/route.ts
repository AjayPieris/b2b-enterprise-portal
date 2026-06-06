import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import {
  getAlerts,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../../lib/alertStore";

export async function GET(request: Request) {
  const authResult = await validateToken(request);
  
  if (!authResult.valid) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401 }
    );
  }

  return NextResponse.json({
    alerts: getAlerts(),
    unreadCount: getUnreadCount(),
  });
}

export async function PATCH(request: Request) {
  const authResult = await validateToken(request);
  
  if (!authResult.valid) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (body.all) {
      markAllAsRead();
    } else if (body.id) {
      markAsRead(body.id);
    } else {
      return NextResponse.json(
        { error: "Invalid payload: must provide 'all' or 'id'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      unreadCount: getUnreadCount() 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
