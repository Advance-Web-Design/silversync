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
import { useZoom } from '../../hooks/useZoom';
import * as BoardStyles from '../../styles/BoardStyle.js'; // Import BoardStyle
import './GameBoard.css';

const GameBoard = React.memo(() => {
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
    searchResults   // Get search results to determine if search panel is expanded
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

  const { zoomLevel, handleWheel } = useZoom();

  // Check if there are any guest appearances in the connections
  const hasGuestAppearances = connections.some(conn => conn.isGuestAppearance === true);

  // Check if search has results to adjust stats display position
  const hasSearchResults = Boolean(searchResults && searchResults.length > 0);

  /**
   * Dynamically update board dimensions when window resizes or zoom changes
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const effectiveZoom = zoomLevel || 1;
        setBoardSize({
          // divide by zoom so that boardSize × zoom === actual viewport size
          width:  rect.width  / effectiveZoom,
          height: rect.height / effectiveZoom
        });
      }
    };
    // Initial dimensions
    updateDimensions();
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [zoomLevel]);  // <-- now also runs whenever zoomLevel changes

  /**
   * Timer effect - updates the elapsed time every second while game is active
   */
  useEffect(() => {
    if (!gameStartTime || gameCompleted) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStartTime, gameCompleted]);

  /**
   * Update final elapsed time when game is completed
   */
  useEffect(() => {
    if (gameCompleted && gameStartTime) {
      setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
    }
  }, [gameCompleted, gameStartTime]);

  /**
   * Format elapsed time into MM:SS format
   * @param {number} seconds - Seconds to format
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds) => {
    if (seconds == null) return "00:00";
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
    // Always use the calculated shortest path length if available
    if (shortestPathLength !== null) {
      return shortestPathLength;
    }
    // Show placeholder if game is not completed
    if (!gameCompleted) return "???";
    // Fallback to old method as last resort
    return nodes.length - 2;
  };

  // Pre-calculate the formatted values to avoid using hooks in the render method
  const formattedTimeValue      = formatTime(elapsedTime);
  const formattedBestScoreValue = formatBestScore();
  const pathLengthValue         = getPathLength();

  // For debugging purposes, log the search results state
  // TODO: Remove this useEffect before final release
  useEffect(() => {
    console.log('Search results state:', {
      hasResults: hasSearchResults,
      resultsLength: searchResults?.length || 0
    });
  }, [searchResults, hasSearchResults]);

  return (
    <Box
      ref={boardRef}
      className={BoardStyles.gameBoardContainerStyle} // Use style from BoardStyle.js
      style={{
        // backgroundImage remains inline due to its complexity with multiple layers
        backgroundImage: "url('/game-bg2.png'), radial-gradient(circle, rgba(20,20,35,1) 0%, rgba(10,10,26,1) 100%)"
      }}
      onWheel={handleWheel}
    >
      <div
        className={BoardStyles.zoomWrapperStyle} // Use style from BoardStyle.js
        // Removed inline styles: width, height, position, overflow (now in zoomWrapperStyle)
      >
        <div
          className={BoardStyles.zoomContentBaseStyle} // Use base style from BoardStyle.js
          style={{
            width:           `${boardSize.width}px`,  // Dynamic, remains inline
            height:          `${boardSize.height}px`, // Dynamic, remains inline
            transform:       `scale(${zoomLevel})`,   // Dynamic, remains inline
            // Removed: position, transformOrigin, transition (now in zoomContentBaseStyle)
          }}
        >
          {/* Connection lines behind nodes */}
          <ConnectionLines 
            connections={connections}
            nodePositions={nodePositions}
            connectionRefs={connectionRefs}
            boardSize={boardSize}
            gameCompleted={gameCompleted}
          />

          {/* Nodes on top */}
          <NodeLayer
            nodes={nodes}
            nodePositions={nodePositions}
            updateNodePosition={updateNodePosition}
            boardSize={boardSize}
            startActors={startActors}
            zoomLevel={zoomLevel}
          />
        </div>
      </div>

      {selectedNode && <ConnectionsPanel />}
      {isLoading    && <LoadingOverlay />}

      <GameStats
        formattedBestScore={formattedBestScoreValue}
        formattedTime={formattedTimeValue}
        pathLength={pathLengthValue}
        hasGuestAppearances={hasGuestAppearances}
        hasSearchResults={hasSearchResults}
      />

      {/* Zoom percentage indicator */}
      <div
        className={BoardStyles.zoomIndicatorStyle} // Use style from BoardStyle.js
        // Removed inline styles (now in zoomIndicatorStyle)
      >
        Zoom: {(zoomLevel * 100).toFixed(0)}%      
        </div>
    </Box>
  );
});

export default GameBoard;
