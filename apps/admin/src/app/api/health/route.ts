import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  let apiReachable = false;
  try {
    const res = await fetch(`${apiUrl}/api/health/live`, {
      signal: AbortSignal.timeout(5000),
    });
    apiReachable = res.ok;
  } catch {
    apiReachable = false;
  }

  return NextResponse.json(
    {
      status: apiReachable ? 'ok' : 'degraded',
      app: 'admin',
      timestamp: new Date().toISOString(),
      api: apiReachable ? 'reachable' : 'unreachable',
    },
    { status: apiReachable ? 200 : 503 },
  );
}
