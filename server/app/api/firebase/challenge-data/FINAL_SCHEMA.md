# Challenge Data System - Final Schema & Design

## Database Schema (Firebase)

### Ultra-Minimal Challenge Data Structure
```javascript
challenge-blacklists/
├── "no-marvel"/
│   ├── lastUpdated: "2024-12-31T23:59:59.999Z"
│   ├── blockedMovies: {
│   │   ├── "299536": { "id": 299536, "title": "Avengers: Infinity War" },
│   │   ├── "299534": { "id": 299534, "title": "Avengers: Endgame" },
│   │   ├── "315635": { "id": 315635, "title": "Spider-Man: Homecoming" }
│   │   // ... only Marvel movies (ID + title only)
│   │   }
│   ├── blockedTvShows: {
│   │   ├── "1403": { "id": 1403, "name": "Marvel's Agents of S.H.I.E.L.D." },
│   │   ├── "38472": { "id": 38472, "name": "The Falcon and the Winter Soldier" }
│   │   // ... only Marvel TV shows (ID + name only)
│   │   }
│   ├── companyIds: [420, 7505, 19551]
│   ├── companyNames: ["Marvel Studios", "Marvel Entertainment", "Marvel Comics", ...]
│   ├── fetchMethod: "hybrid"
│   ├── stats: { "totalMovies": 87, "totalTvShows": 23 }
│   └── generatedAt: "2024-12-31T23:59:59.999Z"
│
├── "no-dc"/
│   ├── lastUpdated: "2024-12-31T23:59:59.999Z"
│   ├── blockedMovies: {
│   │   ├── "414906": { "id": 414906, "title": "The Batman" },
│   │   ├── "297761": { "id": 297761, "title": "Suicide Squad" }
│   │   }
│   ├── blockedTvShows: {
│   │   ├── "1434": { "id": 1434, "name": "The Flash" },
│   │   ├── "1412": { "id": 1412, "name": "Arrow" }
│   │   }
│   ├── companyIds: [429, 1363, 9993]
│   ├── companyNames: ["DC Entertainment", "DC Comics", "DC Films", ...]
│   ├── fetchMethod: "hybrid"
│   ├── stats: { "totalMovies": 45, "totalTvShows": 12 }
│   └── generatedAt: "2024-12-31T23:59:59.999Z"
│
├── "movies-only"/
│   ├── lastUpdated: "2024-12-31T23:59:59.999Z"
│   ├── blockedMovies: {}                // No movies blocked
│   ├── blockedTvShows: "*"              // All TV shows blocked
│   ├── fetchMethod: "special"
│   └── generatedAt: "2024-12-31T23:59:59.999Z"
│
├── "tv-only"/
│   ├── lastUpdated: "2024-12-31T23:59:59.999Z"
│   ├── blockedMovies: "*"               // All movies blocked
│   ├── blockedTvShows: {}               // No TV shows blocked
│   ├── fetchMethod: "special"
│   └── generatedAt: "2024-12-31T23:59:59.999Z"
│
├── "no-disney"/
│   ├── lastUpdated: "2024-12-31T23:59:59.999Z"
│   ├── blockedMovies: {
│   │   ├── "62177": { "id": 62177, "title": "The Lion King" },
│   │   ├── "129": { "id": 129, "title": "Spirited Away" },
│   │   ├── "12092": { "id": 12092, "title": "Alice in Wonderland" }
│   │   // ... all Disney movies
│   │   }
│   ├── blockedTvShows: {
│   │   ├── "1771": { "id": 1771, "name": "DuckTales" },
│   │   ├── "18357": { "id": 18357, "name": "The Mandalorian" }
│   │   // ... all Disney TV shows
│   │   }
│   ├── companyIds: [2, 3, 420, 7505, 1, 13252, 3475]
│   ├── companyNames: ["Walt Disney Pictures", "Pixar", "Marvel Studios", ...]
│   ├── fetchMethod: "hybrid"
│   ├── stats: { "totalMovies": 156, "totalTvShows": 89 }
│   └── generatedAt: "2024-12-31T23:59:59.999Z"
│
└── "Nathan"/
    ├── lastUpdated: "2024-12-31T23:59:59.999Z"
    ├── blockedMovies: {
    │   // Combined Disney + DC movies
    │   ├── "62177": { "id": 62177, "title": "The Lion King" },
    │   ├── "414906": { "id": 414906, "title": "The Batman" },
    │   ├── "129": { "id": 129, "title": "Spirited Away" },
    │   ├── "297761": { "id": 297761, "title": "Suicide Squad" }
    │   }
    ├── blockedTvShows: "*"              // All TV shows blocked (movies-only)
    ├── companyIds: [2, 3, 420, 7505, 1, 13252, 3475, 429, 1363, 9993]
    ├── companyNames: ["Walt Disney Pictures", "Pixar", "DC Entertainment", ...]
    ├── fetchMethod: "hybrid"
    ├── stats: { "totalMovies": 201, "totalTvShows": 0 }
    └── generatedAt: "2024-12-31T23:59:59.999Z"

// NOTE: "for-fun" and "classic" have NO DATA - no filtering needed
```

## TMDB Company ID Mappings

### Pre-mapped Company IDs for Efficient Bulk Fetching
```javascript
const CHALLENGE_COMPANY_MAPPINGS = {
  'no-marvel': {
    companyIds: [420, 7505, 19551], // Marvel Studios, Marvel Entertainment, Marvel Television
    companyNames: ['Marvel Studios', 'Marvel Entertainment', 'Marvel Enterprises', 'Marvel Comics', 'Marvel Television']
  },
  'no-dc': {
    companyIds: [429, 1363, 9993], // DC Entertainment, DC Comics, DC Films
    companyNames: ['DC Entertainment', 'DC Comics', 'DC Films', 'DC Universe', 'DC Entertainment Television']
  },
  'no-disney': {
    companyIds: [2, 3, 420, 7505, 1, 13252, 3475], // Disney, Pixar, Marvel, Lucasfilm, 20th Century, etc.
    companyNames: [
      // Disney Core
      'Walt Disney Pictures', 'Walt Disney Animation Studios', 'Disney Television Animation',
      'Disney Channel', 'Disney Junior', 'Disney XD', 'Disney+', 'The Walt Disney Company', 'Walt Disney Studios',
      // Pixar
      'Pixar', 'Pixar Animation Studios',
      // Marvel
      'Marvel Studios', 'Marvel Entertainment', 'Marvel Enterprises', 'Marvel Comics', 'Marvel Television',
      // Lucasfilm
      'Lucasfilm', 'Lucasfilm Ltd.', 'LucasArts',
      // 20th Century
      '20th Century Studios', '20th Century Fox', '20th Television', '20th Century Fox Television',
      // Other subsidiaries
      'Touchstone Pictures', 'Hollywood Pictures', 'ABC', 'ABC Studios', 'ABC Family', 'ESPN', 'Freeform',
      'Blue Sky Studios', 'National Geographic', 'FX Networks', 'Hulu'
    ]
  },
  'Nathan': {
    companyIds: [2, 3, 420, 7505, 1, 13252, 3475, 429, 1363, 9993], // Disney + DC combined
    companyNames: [/* Combined Disney + DC arrays */]
  }
};
```

## TMDB Bulk Endpoints Used

### Discover API (Primary Method)
```javascript
// Get movies by company
GET /discover/movie?with_companies={company_ids}&page={page}

// Get TV shows by company  
GET /discover/tv?with_companies={company_ids}&page={page}

// Company search (for ID resolution)
GET /search/company?query={company_name}
```

## Client Flow

### 1. App Initialization
```javascript
// Load blacklists on app start
const challengeBlacklists = await loadChallengeBlacklists();
sessionStorage.setItem('challengeBlacklists', JSON.stringify(challengeBlacklists));
```

### 2. Gameplay Filtering
```javascript
// Apply blacklist during connection fetching
const filteredConnections = filterConnectionsByChallenge(connections, challengeMode);
```

### 3. Filter Logic
```javascript
// Simple Set.has() lookup for O(1) performance
if (blacklist.blockedMovies.has(connection.id.toString())) {
  return false; // Block this movie
}
```

## Benefits Summary

- **Ultra-Minimal Storage**: Only blacklisted items (50-200 vs 10,000+ items)
- **Bulk API Efficiency**: 20 items per API call vs individual calls
- **Lightning Fast Client**: O(1) Set.has() lookup
- **Automatic Updates**: Cron job checks every 2 weeks
- **Zero Gameplay Delays**: Pre-computed blacklists loaded once
- **Cost Effective**: Minimal Firebase storage and TMDB API usage

## Cron Schedule

```bash
# Check for updates daily, process as needed (2-week intervals)
0 2 * * * curl -X POST https://your-domain.com/api/firebase/challenge-data/cron-check
```

## Data Size Estimates

- **no-marvel**: ~87 movies, ~23 TV shows (~2-5KB)
- **no-dc**: ~45 movies, ~12 TV shows (~1-3KB) 
- **movies-only**: 0 movies, "*" TV shows (~1KB)
- **tv-only**: "*" movies, 0 TV shows (~1KB)
- **no-disney**: ~156 movies, ~89 TV shows (~5-10KB)
- **Nathan**: ~201 movies, "*" TV shows (~5-8KB)

**Total Storage**: ~15-30KB for all challenge blacklists combined
