/**
 * GameBoard.jsx
 * 
 * This is the main game board component that:
 * 1. Displays all nodes (actors, movies, TV shows) positioned on the board
 * 2. Renders connection lines between related nodes
 * 3. Handles board size and scaling
 * 4. Manages the drawing of lines as visual connections between entities
 * 5. Coordinates with the game state for displaying the current game status
 */
import React, { useRef, useEffect, useState } from 'react';
import { useGameContext } from '../../contexts/gameContext';
import ConnectionsPanel from './ConnectionsPanel';
import LoadingOverlay from './LoadingOverlay';
import GameStats from './GameStats';
import NodeLayer from './NodeLayer';
import ConnectionLines from './ConnectionLines';
import { Box } from '@mui/material';
import './GameBoard.css';

const GameBoard = () => {
  // Get game state and functions from context
  const {
    nodes,
    connections,
    nodePositions,
    updateNodePosition,
    isLoading,
    gameCompleted,
    startActors,
    selectedNode,
    gameStartTime,
    bestScore,
    shortestPathLength,
    searchResults // Get search results to determine if search panel is expanded
  } = useGameContext();
  
  // Refs for DOM elements and animation
  const boardRef = useRef(null);
  // const svgRef = useRef(null); // Removed unused ref
  
  // Create refs for connections to animate them
  const connectionRefs = useRef({});
  
  // Set board dimensions using state
  const [boardSize, setBoardSize] = useState({ width: 1000, height: 800 });
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if there are any guest appearances in the connections
  const hasGuestAppearances = connections.some(connection => connection.isGuestAppearance === true);
  
  // Check if search has results to adjust stats display position
  const hasSearchResults = Boolean(searchResults && searchResults.length > 0);

  /**
   * Dynamically update board dimensions when window resizes
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Initial dimensions
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  /**
   * Timer effect - updates the elapsed time every second while game is active
   */
  useEffect(() => {
    if (!gameStartTime || gameCompleted) return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const timeElapsed = Math.floor((now - gameStartTime) / 1000);
      setElapsedTime(timeElapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStartTime, gameCompleted]);
  
  /**
   * Update final elapsed time when game is completed
   */
  useEffect(() => {
    if (gameCompleted && gameStartTime) {
      const completionTime = Math.floor((new Date().getTime() - gameStartTime) / 1000);
      setElapsedTime(completionTime);
    }
  }, [gameCompleted, gameStartTime]);
  
  /**
   * Format elapsed time into MM:SS format
   * @param {number} seconds - Seconds to format
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  /**
   * Format the best score with thousands separator
   * @returns {string} Formatted best score
   */
  const formatBestScore = () => {
    if (!bestScore) return "???";
    return bestScore.toLocaleString();
  };
  
  /**
   * Get the length of the shortest path between the starting actors
   * @returns {string|number} Path length or placeholder
   */
  const getPathLength = () => {
    if (!gameCompleted) return "???";
    
    // Use the calculated shortest path length if available
    if (shortestPathLength !== null) {
      return shortestPathLength;
    }
    
    // Fallback to old method
    return nodes.length - 2;
  };

  // pre-calculate the formatted values to avoid using hooks in the render method
  const formattedTimeValue = formatTime(elapsedTime);
  const formattedBestScoreValue = formatBestScore();
  const pathLengthValue = getPathLength();

  // For debugging purposes, log the search results state
  // TODO: Remove this useEffect before final release
  useEffect(() => {
    console.log('Search results state:', { hasResults: hasSearchResults, resultsLength: searchResults?.length || 0 });
  }, [searchResults, hasSearchResults]);

  return (
    <Box 
      ref={boardRef}
      className="game-board-container"
    >
      <ConnectionLines 
        connections={connections}
        nodePositions={nodePositions}
        connectionRefs={connectionRefs}
        boardSize={boardSize}
        gameCompleted={gameCompleted}
      />
      {/* Node Layer - contains all the draggable entities (actors, movies, TV shows) */}
      <NodeLayer
          nodes={nodes}
          nodePositions={nodePositions}
          updateNodePosition={updateNodePosition}
          boardSize={boardSize}
          startActors={startActors}
      />
        
        
      {/* Other components... */}
      {selectedNode && <ConnectionsPanel />}
      {isLoading && <LoadingOverlay />}
      
      {/* Game Stats - displays game statistics */}
      <GameStats
        formattedBestScore={formattedBestScoreValue}
        formattedTime={formattedTimeValue}
        pathLength={pathLengthValue}
        hasGuestAppearances={hasGuestAppearances}
        hasSearchResults={hasSearchResults}
      />
    </Box>
  );
};

export default GameBoard;