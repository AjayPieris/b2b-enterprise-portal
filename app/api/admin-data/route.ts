import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Intercept the incoming request and look for the Authorization header
  const authHeader = request.headers.get('authorization');

  // 2. If there is no header, or it doesn't contain a Bearer token, reject it immediately
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid token. Access Denied.' }, 
      { status: 401 }
    );
  }


  // 3. If the token is present, return the sensitive enterprise data
  return NextResponse.json({ 
    success: true, 
    data: {
      totalBilling: "$54,230.00",
      activeUsers: 142,
      serverStatus: "Healthy"
    } 
  });
}