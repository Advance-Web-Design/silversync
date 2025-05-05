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
import { useGameContext } from '../../contexts/GameContext';
import DraggableNode from './DraggableNode';
import ConnectionsPanel from './ConnectionsPanel';
import LoadingOverlay from './LoadingOverlay';
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
  const svgRef = useRef(null);
  
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

  // For debugging purposes, log the search results state
  useEffect(() => {
    console.log('Search results state:', { hasResults: hasSearchResults, resultsLength: searchResults?.length || 0 });
  }, [searchResults, hasSearchResults]);

  return (
    <Box 
      ref={boardRef}
      className="game-board-container"
    >
      {/* SVG Layer for connections - draws lines between connected entities */}
      <svg 
        ref={svgRef}
        className="connections-layer"
        width={boardSize.width}
        height={boardSize.height}
      >
        {connections.map(connection => {
          const sourceNodeId = connection.source;
          const targetNodeId = connection.target;
          
          const sourcePosition = nodePositions[sourceNodeId];
          const targetPosition = nodePositions[targetNodeId];
          
          if (!sourcePosition || !targetPosition) return null;
          
          // Find the source and target node DOM elements to get their dimensions
          const sourceNode = document.getElementById(sourceNodeId);
          const targetNode = document.getElementById(targetNodeId);
          
          // Default position if DOM elements aren't available yet
          let x1 = sourcePosition.x;
          let y1 = sourcePosition.y;
          let x2 = targetPosition.x;
          let y2 = targetPosition.y;
          
          // Calculate center points of the nodes if DOM elements are available
          if (sourceNode && targetNode) {
            const sourceRect = sourceNode.getBoundingClientRect();
            const targetRect = targetNode.getBoundingClientRect();
            
            // Calculate center points
            x1 = sourcePosition.x + (sourceRect.width / 2);
            y1 = sourcePosition.y + (sourceRect.height / 2);
            x2 = targetPosition.x + (targetRect.width / 2);
            y2 = targetPosition.y + (targetRect.height / 2);
          }
          
          // Determine if this is a guest appearance connection
          const isGuestAppearance = connection.isGuestAppearance === true;
          
          // Generate unique connection ID
          const connectionId = `connection-${connection.id}`;
          
          return (
            <line
              key={connectionId}
              ref={el => connectionRefs.current[connectionId] = el}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={`connection-line ${isGuestAppearance ? 'guest-appearance' : ''} ${gameCompleted ? 'completed' : ''}`}
            />
          );
        })}
      </svg>

      {/* Node Layer - contains all the draggable entities (actors, movies, TV shows) */}
      <Box className="nodes-container">
        {nodes.map(node => {
          // Check if this node is one of the starting actors
          const isStartActor = startActors.some(actor => 
            `person-${actor.id}` === node.id
          );
          
          return (
            <DraggableNode
              key={node.id}
              node={node}
              position={nodePositions[node.id] || { x: 0, y: 0 }}
              updatePosition={(position) => updateNodePosition(node.id, position)}
              boardWidth={boardSize.width}
              boardHeight={boardSize.height}
              isStartActor={isStartActor}
            />
          );
        })}
      </Box>

      {/* Stats display - shows game information and moves when search results appear */}
      <div 
        className={`stats-display ${hasGuestAppearances ? 'with-guest-appearances' : ''} ${hasSearchResults ? 'with-search-results' : ''}`}
        data-has-results={hasSearchResults ? 'true' : 'false'} // For debugging
      >
        <div className="stat-item best-score">BEST SCORE: {formatBestScore()}</div>
        <div className="stat-item timer">TIMER: {formatTime(elapsedTime)}</div>
        <div className="stat-item best-path">SHORTEST PATH: {getPathLength()}</div>
      </div>
      
      {/* Guest Appearances Message - explains dashed lines and moves when search results appear */}
      {hasGuestAppearances && (
        <div className={`guest-appearances-message ${hasSearchResults ? 'with-search-results' : ''}`}>
          <span>Dashed lines = Guest Star Appearances</span>
        </div>
      )}

      {/* ConnectionsPanel - shows when a node is selected to display its connections */}
      {selectedNode && <ConnectionsPanel />}

      {/* Loading Overlay - appears during API calls and data processing */}
      {isLoading && <LoadingOverlay />}
    </Box>
  );
};

export default GameBoard;