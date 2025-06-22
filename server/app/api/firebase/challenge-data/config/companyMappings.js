/**
 * TMDB Company ID mappings for efficient bulk fetching
 * Used to identify which movies/TV shows belong to specific companies
 */

export const CHALLENGE_COMPANY_MAPPINGS = {
  'no-marvel': {
    companyIds: [420, 7505, 19551], // Marvel Studios, Marvel Entertainment, Marvel Television
    companyNames: [
      'Marvel Studios', 
      'Marvel Entertainment', 
      'Marvel Enterprises', 
      'Marvel Comics', 
      'Marvel Television',
      'Marvel Animation',
      'Marvel Knights'
    ]
  },
  
  'no-dc': {
    companyIds: [429, 1363, 9993], // DC Entertainment, DC Comics, DC Films
    companyNames: [
      'DC Entertainment', 
      'DC Comics', 
      'DC Films', 
      'DC Universe', 
      'DC Entertainment Television',
      'DC Animation',
      'Warner Bros. Animation' // Often produces DC content
    ]
  },
  
  'no-disney': {
    companyIds: [2, 3, 420, 7505, 1, 13252, 3475], // Disney, Pixar, Marvel, Lucasfilm, 20th Century, etc.
    companyNames: [
      // Disney Core
      'Walt Disney Pictures', 
      'Walt Disney Animation Studios', 
      'Disney Television Animation',
      'Disney Channel', 
      'Disney Junior', 
      'Disney XD', 
      'Disney+', 
      'The Walt Disney Company', 
      'Walt Disney Studios',
      
      // Pixar
      'Pixar', 
      'Pixar Animation Studios',
      
      // Marvel (owned by Disney)
      'Marvel Studios', 
      'Marvel Entertainment', 
      'Marvel Enterprises', 
      'Marvel Comics', 
      'Marvel Television',
      
      // Lucasfilm (owned by Disney)
      'Lucasfilm', 
      'Lucasfilm Ltd.', 
      'LucasArts',
      
      // 20th Century (owned by Disney)
      '20th Century Studios', 
      '20th Century Fox', 
      '20th Television', 
      '20th Century Fox Television',
      
      // Other Disney subsidiaries
      'Touchstone Pictures', 
      'Hollywood Pictures', 
      'ABC', 
      'ABC Studios', 
      'ABC Family', 
      'ESPN', 
      'Freeform',
      'Blue Sky Studios', 
      'National Geographic', 
      'FX Networks', 
      'Hulu'
    ]
  },
  
  'Nathan': {
    // Combined Disney + DC (Nathan's custom challenge)
    companyIds: [2, 3, 420, 7505, 1, 13252, 3475, 429, 1363, 9993],
    companyNames: [
      // Disney companies (from above)
      'Walt Disney Pictures', 'Walt Disney Animation Studios', 'Disney Television Animation',
      'Disney Channel', 'Disney Junior', 'Disney XD', 'Disney+', 'The Walt Disney Company', 'Walt Disney Studios',
      'Pixar', 'Pixar Animation Studios',
      'Marvel Studios', 'Marvel Entertainment', 'Marvel Enterprises', 'Marvel Comics', 'Marvel Television',
      'Lucasfilm', 'Lucasfilm Ltd.', 'LucasArts',
      '20th Century Studios', '20th Century Fox', '20th Television', '20th Century Fox Television',
      'Touchstone Pictures', 'Hollywood Pictures', 'ABC', 'ABC Studios', 'ABC Family', 'ESPN', 'Freeform',
      'Blue Sky Studios', 'National Geographic', 'FX Networks', 'Hulu',
      
      // DC companies (from above)
      'DC Entertainment', 'DC Comics', 'DC Films', 'DC Universe', 'DC Entertainment Television',
      'DC Animation', 'Warner Bros. Animation'
    ]
  }
};

/**
 * Special challenge configurations
 */
export const SPECIAL_CHALLENGES = {
  'movies-only': {
    blockedMovies: {},
    blockedTvShows: '*' // Block all TV shows
  },
  'tv-only': {
    blockedMovies: '*', // Block all movies
    blockedTvShows: {}
  }
};

/**
 * Challenges that require no filtering (no blacklists needed)
 */
export const NO_FILTER_CHALLENGES = ['for-fun', 'classic'];

/**
 * Get company configuration for a challenge
 */
export function getChallengeConfig(challengeName) {
  // Special challenges (movies-only, tv-only)
  if (SPECIAL_CHALLENGES[challengeName]) {
    return SPECIAL_CHALLENGES[challengeName];
  }
  
  // Company-based challenges
  if (CHALLENGE_COMPANY_MAPPINGS[challengeName]) {
    return CHALLENGE_COMPANY_MAPPINGS[challengeName];
  }
  
  // No filtering needed
  if (NO_FILTER_CHALLENGES.includes(challengeName)) {
    return null;
  }
  
  throw new Error(`Unknown challenge: ${challengeName}`);
}