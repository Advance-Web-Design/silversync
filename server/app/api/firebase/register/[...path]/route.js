import { NextResponse } from 'next/server';
import { addUser } from '../../utils/firebaseLogic.js';
import { handlePreflight, withCors } from '../../../utils/cors.js';

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return handlePreflight();
}




export async function POST(request,{ params }) {
  try {
    const body = await request.json();

    const { username, password, email } = body;
    const userId = await addUser(username, password, email);

    return NextResponse.json({ userId });
  } catch (err) {
    console.error('Error registering user:', err);
    console.log('Error details:',);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}