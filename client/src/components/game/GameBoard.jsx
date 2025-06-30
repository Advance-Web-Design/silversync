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
import { logger } from '../../utils/loggerUtils';
import { useTheme } from '../../contexts/ThemeContext';

const GameBoard = React.memo(() => {
  // Get game state and functions from context
  const {
    nodes,
    connections,
    nodePositions,
    updateNodePosition,
    isLoading,
    gameCompleted,
    startActors,    selectedNode,
    gameStartTime,
    gameScore,
    currentGameScore, // Add current game score
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
        
        // Get actual viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate safe areas for mobile
        const isPortrait = viewportHeight > viewportWidth;
        const safeAreaTop = isPortrait ? 80 : 60;
        const safeAreaBottom = isPortrait ? 180 : 120;
        
        // Calculate available space
        const availableWidth = Math.max(rect.width, viewportWidth - 20);
        const availableHeight = Math.max(rect.height, viewportHeight - safeAreaTop - safeAreaBottom);
        
        setBoardSize({
          width: Math.max(availableWidth / effectiveZoom, 320),
          height: Math.max(availableHeight / effectiveZoom, 480)
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(updateDimensions, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
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
  };  /**
   * Format the game score with thousands separator
   * @returns {string} Formatted game score
   */
  const formatGameScore = () => {
    // When game is completed, show the current game's score
    if (gameCompleted && currentGameScore !== null) {
      return currentGameScore.toLocaleString();
    }
    // Otherwise show the best score or placeholder
    if (!gameScore) return "???";
    return gameScore.toLocaleString();
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
  const formattedGameScoreValue = formatGameScore();
  const pathLengthValue         = getPathLength();

  //boolean for dark or light mode
  const { isLightMode } = useTheme();
  return (
    <Box
      ref={boardRef}
      className={BoardStyles.gameBoardContainerBaseStyle + " " +
        (isLightMode ? BoardStyles.gameBoardContainerLightStyle : BoardStyles.gameBoardContainerDarkStyle)} // Use styles from BoardStyle.js
      onWheel={handleWheel}
    >
      <div
        className={BoardStyles.zoomWrapperStyle} // Use style from BoardStyle.js
        
      >
        <div
          className={BoardStyles.zoomContentBaseStyle} // Use base style from BoardStyle.js
          style={{
            width:           `${boardSize.width}px`,  // Dynamic, remains inline
            height:          `${boardSize.height}px`, // Dynamic, remains inline
            transform:       `scale(${zoomLevel})`,   // Dynamic, remains inline
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
      {isLoading    && <LoadingOverlay />}      <GameStats
        formattedGameScore={formattedGameScoreValue}
        formattedTime={formattedTimeValue}
        pathLength={pathLengthValue}
        hasGuestAppearances={hasGuestAppearances}
        hasSearchResults={hasSearchResults}
        gameCompleted={gameCompleted}
      />

      {/* Zoom percentage indicator - only show on medium/large screens */}
      {window.innerWidth >= 900 && (
        <div className={BoardStyles.zoomIndicatorStyle}>
          Zoom: {(zoomLevel * 100).toFixed(0)}%      
        </div>
      )}
    </Box>
  );
});

export default GameBoard;
