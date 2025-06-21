import { NextResponse } from 'next/server';
import { withCors } from '../../../utils/cors.js';

/**
 * API route to fetch user game history
 * @description This function retrieves the user's complete game history from the database
 */
export async function POST(request) {
    try {
        const { getUserGameHistory } = await import('../../utils/firebaseLogic.js');
        
        const { userId } = await request.json();
        
        if (!userId) {
            return withCors(NextResponse.json({ 
                success: false, 
                message: 'User ID is required' 
            }, { status: 400 }));
        }

        const gameHistory = await getUserGameHistory(userId);
        
        return withCors(NextResponse.json({ 
            success: true, 
            gameHistory 
        }));
        
    } catch (error) {
        console.error('Fetch game history error:', error.message);
        return withCors(NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to fetch game history' 
        }, { status: 500 }));
    }
}

export async function OPTIONS(request) {
    return withCors(new Response(null, { status: 200 }));
}
