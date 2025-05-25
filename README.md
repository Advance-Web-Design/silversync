# Connect The Stars

An interactive web game where players connect Hollywood actors through movies and TV shows they've appeared in. Starting with two actors, players must find connections between them by adding movies, TV shows, and other actors to the board. The game is won when a path exists between the two starting actors.

## 🚨 Known Issues

1. **Shortest Path not Upadting*: the shortest path doesn't update if ater victory a shorter path is found
2. **Cheat Sheet UI Bug**: Cheat sheet moves stat bar to the middle of the screen and gets it stuck there
3. **Search Panel Bug**: If NOT selecting a movie from cheat sheet and hitting X, then searching for any character/string, everything from the cheat sheet is displayed as search results
4. **Z-Index Issue**: When a card is behind the header, it cannot be clicked

## 🏗️ Architecture & Data Flow

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Backend Server │    │   TMDB API      │
│  (Port 5174)    │───▶│  (Port 3000)    │───▶│                 │
│                 │    │                 │    │                 │
│ • React/Vite    │    │ • Next.js 15    │    │ • External API  │
│ • API calls     │    │ • Fetch API     │    │ • Images (CDN)  │
│ • Image display │    │ • CORS headers  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **API Data**: Client → `apiService.js` → Backend API Routes → TMDB API
2. **Images**: Client → `tmdbUtils.js` → TMDB CDN (direct)

### Technical Stack

- **Frontend**: React + Vite
- **Backend**: Next.js 15 (Serverless Architecture)
- **State Management**: React Context API + Custom Hooks
- **Styling**: Tailwind CSS
- **API**: The Movie Database (TMDB)
- **Visualization**: Custom draggable components
- **HTTP Client**: Native Fetch API (no dependencies)

## 📁 Project Structure

```
Connect-the-shows/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── game/       # Game-specific components
│   │   ├── contexts/       # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── public/             # Static assets
│   └── package.json        # Client dependencies
└── server/                 # Backend Next.js server
    ├── app/
    │   ├── api/            # API routes
    │   │   ├── tmdb/       # TMDB proxy routes
    │   │   └── utils/      # API utilities
    │   └── layout.js       # Next.js layout
    ├── middleware.js       # CORS middleware
    └── package.json        # Server dependencies
```

### Key Components

#### Frontend (`client/src/`)

**Core Components:**
- `App.jsx` - Root component with routing
- `StartScreen.jsx` - Game setup and actor selection
- `GameBoard.jsx` - Main game board with drag & drop
- `DraggableNode.jsx` - Individual entity cards
- `SearchPanel.jsx` - Search interface
- `ConnectionsPanel.jsx` - Connection visualization

**State Management:**
- `contexts/GameProvider.jsx` - Central game state
- `hooks/useBoard.js` - Board management logic
- `hooks/useGame.js` - Game mechanics
- `hooks/useSearch.js` - Search functionality

**Services:**
- `services/apiService.js` - Backend API client
- `services/tmdbService.js` - TMDB data processing
- `utils/tmdbUtils.js` - TMDB utility functions

#### Backend (`server/app/api/`)

**API Routes:**
- `tmdb/[...path]/route.js` - Catch-all TMDB proxy
- `tmdb/actor/[...path]/route.js` - Actor-specific endpoints
- `tmdb/movie/[...path]/route.js` - Movie-specific endpoints
- `tmdb/search/[...path]/route.js` - Search endpoints
- `tmdb/tv-show/[...path]/route.js` - TV show endpoints

**Utilities:**
- `utils/cors.js` - CORS handling utilities
- `middleware.js` - Global CORS middleware

## 🎮 Game Mechanics

1. **Game Setup**: Players select or are assigned two random starting actors
2. **Search & Discovery**: Players search for movies, TV shows, or other actors
3. **Building Connections**: Players add entities to the board to create a connection path
4. **Win Condition**: Game is won when a path exists between the two starting actors
5. **Scoring**: Based on completion time and the length of the connecting path

### Connection Logic

- Actors connect to movies/shows they've appeared in
- Movies/shows connect to actors who appeared in them
- Two actors can connect if they've both appeared in the same production
- Guest appearances in TV shows are considered valid connections

## 🔧 Server Features

### API & Security
- **Serverless Architecture**: Built on Next.js 15 serverless functions
- **TMDB API Proxy**: All external API calls routed through secure backend
- **Bearer Token Authentication**: Secure TMDB API access
- **Request Caching**: 60-second cache for improved performance
- **CORS Support**: Comprehensive cross-origin request handling
- **Environment Security**: API keys secured server-side only

### Technical Features
- **Native Fetch API**: No external HTTP dependencies
- **Global Middleware**: Automatic CORS headers on all API routes
- **Preflight Handling**: Full OPTIONS request support for complex CORS scenarios
- **Error Handling**: Graceful error responses with proper HTTP status codes
- **Next.js 15 Compliance**: Async params handling for future compatibility

### API Endpoints

All TMDB API calls are proxied through the backend for security:

- `GET /api/tmdb/search/person?query=<name>` - Search for actors
- `GET /api/tmdb/search/movie?query=<title>` - Search for movies  
- `GET /api/tmdb/search/tv?query=<title>` - Search for TV shows
- `GET /api/tmdb/actor/<id>` - Get actor details
- `GET /api/tmdb/actor/<id>/movie_credits` - Get actor's movie credits
- `GET /api/tmdb/actor/<id>/tv_credits` - Get actor's TV credits
- `GET /api/tmdb/movie/<id>` - Get movie details
- `GET /api/tmdb/movie/<id>/credits` - Get movie cast
- `GET /api/tmdb/tv-show/<id>` - Get TV show details
- `GET /api/tmdb/tv-show/<id>/credits` - Get TV show cast

## 💻 Client Features

### Game Features
- **Interactive Gameplay**: Drag & drop entity positioning
- **Real-time Search**: Instant search results from TMDB
- **Connection Validation**: Automatic path finding between actors
- **Victory Detection**: Smart win condition checking
- **Game Statistics**: Time tracking and path length scoring

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile devices
- **Image Optimization**: Direct loading from TMDB CDN for fast performance
- **Error Handling**: Graceful error states and loading indicators
- **Search Autocomplete**: Dynamic search suggestions
- **Visual Feedback**: Loading states, hover effects, and animations

### Technical Features
- **Environment Detection**: Automatic backend URL configuration
- **Custom Backend Override**: Development testing with different backend URLs
- **State Management**: Centralized game state with React Context
- **Custom Hooks**: Reusable business logic separation
- **Modern React**: Latest React 19 with Vite for fast development

## 🖥️ Server Setup

### Prerequisites

- Node.js 18+ 
- NPM or Yarn
- TMDB API Bearer Token

### Installation

1. **Navigate to server directory:**
   ```powershell
   cd server
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the server directory:
   ```bash
   TMDB_API_TOKEN=your_bearer_token_here
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Start development server:**
   ```powershell
   npm run dev
   ```   The server will be available at `http://localhost:3000`

### CORS Configuration

The server includes comprehensive CORS support:
- Global middleware in `middleware.js`
- Per-route CORS headers
- Preflight OPTIONS request handling
- Support for cross-origin requests

### Security Features

- ✅ API keys secured server-side only
- ✅ All TMDB calls proxied through backend
- ✅ CORS headers configured properly
- ✅ Bearer token authentication
- ✅ Request caching (60 seconds)

## 💻 Client Setup

### Prerequisites

- Node.js 18+
- NPM or Yarn

### Installation

1. **Navigate to client directory:**
   ```powershell
   cd client
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start development server:**
   ```powershell
   npm run dev
   ```

   The client will be available at `http://localhost:5174`

### Build for Production

```powershell
npm run build
```

### Configuration

The client automatically detects the environment and configures the backend URL:

- **Development**: `http://localhost:3000/api`
- **Production**: `/api` (relative path)

You can override the backend URL in development by setting it in localStorage:
```javascript
localStorage.setItem('customBackendUrl', 'http://your-backend-url/api');
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set production TMDB API token
2. **CORS Origins**: Update CORS to specific domains instead of `*`
3. **API URLs**: Configure production backend URLs
4. **Build Optimization**: Run production builds for both client and server
5. **Security Headers**: Ensure all security headers are configured

### Recent Improvements

- ✅ Removed axios dependency (using native fetch)
- ✅ Fixed CORS issues for cross-platform compatibility
- ✅ Enhanced security with backend-only API access
- ✅ Next.js 15 compatibility
- ✅ Improved error handling and logging
- ✅ Optimized bundle size and performance

The application now works consistently across all machines and environments without CORS errors!


