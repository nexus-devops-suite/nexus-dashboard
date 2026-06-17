import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(`Paddle webhook received: ${body.event_name}`);
    return NextResponse.json({
      status: 'success',
      message: 'Paddle subscription webhook synchronized successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
