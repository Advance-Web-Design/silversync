import { NextResponse } from 'next/server';
import { verifyUser } from '../../utils/firebaseLogic.js';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const userId = await verifyUser(username, password);
    return NextResponse.json({ userId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}