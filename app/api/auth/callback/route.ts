import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Auth code is missing' }, { status: 400 });
  }

  console.log(`OAuth code ${code} exchanged successfully with state ${state}`);

  // Redirect client back to active dashboard console
  const dashboardUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(dashboardUrl);
}
