import { NextResponse } from 'next/server';
import { recordGameSession } from '../../utils/firebaseLogic.js';

export async function POST(request) {
  try {
    const sessionData = await request.json();
    const gameId = await recordGameSession(sessionData);
    return NextResponse.json({ gameId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}