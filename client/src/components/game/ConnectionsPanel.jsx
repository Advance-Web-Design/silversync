import React from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { getItemTitle } from '../../utils/stringUtils';

import ConnectionContent from './ConnectionContent';
import './ConnectionsPanel.css';

const ConnectionsPanel = () => {
  const { 
    selectedNode, 
    closeConnectionsPanel, 
    addToBoard,
    nodes
  } = useGameContext();
  
  if (!selectedNode) return null;
  
  // Get appropriate title based on node type
  const title = getItemTitle(selectedNode.data);
  const nodeType = selectedNode.type;
  
  // Organize possible connections based on node type
  const getPossibleConnections = () => {
    switch (nodeType) {
      case 'person': {
        // For actors, show both movies and TV shows
        const movieCredits = selectedNode.data.movie_credits?.cast || [];
        const tvCredits = selectedNode.data.tv_credits?.cast || [];
        
        // Filter to only include movies that are already on the board
        const filteredMovies = movieCredits.filter(movie => isItemOnBoard(movie, 'movie'));
        
        // Filter to only include TV shows that are already on the board
        const filteredTVShows = tvCredits.filter(show => isItemOnBoard(show, 'tv'));
        
        // Sort by popularity or date (using popularity for now)
        const sortedMovies = [...filteredMovies].sort((a, b) => b.popularity - a.popularity);
        const sortedTvShows = [...filteredTVShows].sort((a, b) => b.popularity - a.popularity);
        
        // Mark guest appearances in TV shows - check for multiple possible flags
        const markedTvShows = sortedTvShows.map(show => {
        // Check for various ways guest appearances might be marked
        const isGuest = show.is_guest_appearance || 
                        show.isGuestAppearance ||
                        (show.character && show.character.toLowerCase().includes('guest')) ||
                        (show.credit_id && show.credit_id.toLowerCase().includes('guest')) ||
                        false;
          
          return {
            ...show,
            isGuestAppearance: isGuest
          };
        });
        
        return {
          movies: sortedMovies,
          tvShows: markedTvShows
        };
      }
      
      case 'movie': {
        // For movies, show cast members
        const cast = selectedNode.data.credits?.cast || [];
        
        // Filter to only include actors that are already on the board
        const filteredCast = cast.filter(actor => isItemOnBoard(actor, 'person'));
        
        const sortedCast = [...filteredCast].sort((a, b) => (a.order || 999) - (b.order || 999));
        return { cast: sortedCast };
      }
      
      case 'tv': {
        // For TV shows, show cast members including guest stars
        const regularCast = selectedNode.data.credits?.cast || [];
        const aggregateCast = selectedNode.data.aggregate_credits?.cast || [];
        
        // Use aggregate cast if available (better for long-running shows)
        const castToUse = aggregateCast.length > 0 ? aggregateCast : regularCast;
        
        // Filter to only include actors that are already on the board
        const filteredCast = castToUse.filter(actor => isItemOnBoard(actor, 'person'));
        
        // Sort by popularity or episode count
        const sortedCast = [...filteredCast].sort((a, b) => {
          // First by episode count if available
          const aEpisodes = a.total_episode_count || a.episode_count || 0;
          const bEpisodes = b.total_episode_count || b.episode_count || 0;
          
          if (bEpisodes !== aEpisodes) return bEpisodes - aEpisodes;
          // Then by popularity as tie-breaker
          return b.popularity - a.popularity;
        });
        
        return { cast: sortedCast };
      }
      
      default:
        return {};
    }
  };
  
  // Check if an item is already on the board
  const isItemOnBoard = (item, type) => {
    const itemId = `${type}-${item.id}`;
    return nodes.some(node => node.id === itemId);
  };
  
  const connections = getPossibleConnections();
  
  // Handle adding an item to the board
  const handleAddToBoard = (item, mediaType) => {
    // For TV shows with guest appearances, make sure the guest appearance flag is preserved
    if (mediaType === 'tv' && item.isGuestAppearance) {
      addToBoard({
        ...item,
        media_type: mediaType,
        is_guest_appearance: true, // Ensure this flag is passed to board
        hasGuestAppearances: true // Extra flag to ensure proper processing
      });
    } else {
      addToBoard({
        ...item,
        media_type: mediaType
      });
    }
  };
  
  // Define isGuestStar here, as it's passed to ConnectionContent
  const isGuestStar = (actor) => {
    // Check based on roles array (more robust for aggregate credits)
    if (actor.roles && Array.isArray(actor.roles)) {
      return actor.roles.some(role => role.character && role.character.toLowerCase().includes('guest'));
    }
    // Fallback to checking character directly (for regular credits)
    if (actor.character && typeof actor.character === 'string') {
      return actor.character.toLowerCase().includes('guest');
    }
    // Check for explicit guest appearance flags if present
    if (typeof actor.is_guest_appearance === 'boolean') {
      return actor.is_guest_appearance;
    }
    if (typeof actor.isGuestAppearance === 'boolean') {
        return actor.isGuestAppearance;
    }
    return false; // Default to false if no guest indicators found
  };

  return (
    <div className="connections-panel">
      <div className="connections-header">
        <h2>{title}</h2>
        <button className="close-button" onClick={closeConnectionsPanel}>×</button>
      </div>
      
      <ConnectionContent
        nodeType={nodeType}
        connections={connections}
        isItemOnBoard={isItemOnBoard}
        handleAddToBoard={handleAddToBoard}
        isGuestStar={isGuestStar}
      />
    </div>
  );
};

export default ConnectionsPanel;