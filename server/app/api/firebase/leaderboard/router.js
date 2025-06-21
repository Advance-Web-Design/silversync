// DEPRECATED: This file is replaced by route.js 
// Keeping for reference only - DO NOT USE

import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/utils/firebaseAdmin';

export async function GET() {
  const { db } = initializeFirebase();
  const usersSnapshot = await db.ref('users').once('value'); //go through all users to check for scores
  const allUsers = usersSnapshot.val();

  if (!allUsers)
    return NextResponse.json([], { status: 200 });

  let scores = [];
  for (const username in allUsers) {
    const gameHistory = allUsers[username].gamehistory;
    if (!gameHistory)
        continue; //game history is not found (no game played yet)

    for (const mode in gameHistory) {
/* TODO: make sure leaderboard shows different game modes*/
      gameHistory[mode].forEach(entry => {
        scores.push({
          username,
          score: entry.score,
          time: entry.timeTaken,
        });
      });
    }
  }

  // Sort by score (lower is better)
  scores.sort((a, b) => {
    if (a.score === b.score) {
      return a.time.localeCompare(b.time);
    }
    return a.score - b.score;
  });

  const top10 = scores.slice(0, 10); //show only top 10 scores
  return NextResponse.json(top10);
}
