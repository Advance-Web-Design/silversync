# Connect The Stars - Project Documentation

## Project Overview

"Connect The Stars" is an interactive web game where players connect Hollywood actors through movies and TV shows they've appeared in. Starting with two actors, players must find connections between them by adding movies, TV shows, and other actors to the board. The game is won when a path exists between the two starting actors.

## Project Structure

### Root Files
- `index.html` - Main HTML entry point
- `package.json` - NPM package dependencies and scripts
- `vite.config.js` - Configuration for the Vite build tool
- `tailwind.config.js` - Configuration for Tailwind CSS
- `eslint.config.js` - ESLint configuration for code quality

### Source Files (`src/`)

#### Entry Point
- `main.jsx` - Application entry point that renders the React app
- `App.jsx` - Root component that sets up routing and main app structure
- `index.css` - Global styles using Tailwind
- `App.css` - App-specific styles

#### Contexts (`src/contexts/`)
- `GameContext.jsx` - Central state management for the game, connects all features

#### Hooks (`src/hooks/`)
- `useBoard.js` - Logic for managing the game board, nodes, and connections
- `useGame.js` - Game mechanics like starting games, checking completion, etc.
- `useSearch.js` - Search functionality for finding actors, movies, and shows

#### Components (`src/components/`)

##### Game Components (`src/components/game/`)
- `StartScreen.jsx` - Initial screen for game setup and actor selection
- `GameBoard.jsx` - Main game board where connections are visualized
- `DraggableNode.jsx` - Individual draggable entity (actor/movie/TV show)
- `ConnectionsPanel.jsx` - Shows connections between entities
- `Header.jsx` - Game header with title and controls
- `InfoBar.jsx` - Shows game progress and information
- `LoadingOverlay.jsx` - Loading indicator overlay
- `SearchPanel.jsx` - Search interface for finding entities
- `SearchEntitiesSidebar.jsx` - Sidebar for browsing popular entities

#### Services (`src/services/`)
- `tmdbService.js` - API client for The Movie Database (TMDb)

#### Utils (`src/utils/`)
- `constants.js` - Game constants and configuration values
- `stringUtils.js` - String manipulation and formatting utilities

## Key Game Mechanics

1. **Game Setup**: Players select or are assigned two random starting actors.
2. **Search & Discovery**: Players search for movies, TV shows, or other actors.
3. **Building Connections**: Players add entities to the board to create a connection path.
4. **Win Condition**: The game is won when a path exists between the two starting actors.
5. **Scoring**: Based on completion time and the length of the connecting path.

## State Management

The game state is centrally managed through the GameContext provider, which:
- Tracks game progress
- Manages the board state
- Handles search functionality
- Validates connections
- Checks for win conditions

## Connection Logic

Connections between entities are established based on these rules:
- Actors connect to movies/shows they've appeared in
- Movies/shows connect to actors who appeared in them
- Two actors can connect if they've both appeared in the same production
- Guest appearances in TV shows are also considered valid connections

## Technical Implementation

The application is built with:
- React for UI components
- Context API for state management
- Custom hooks for business logic
- TMDb API for movie, TV show, and actor data
- React Flow for the interactive network visualization