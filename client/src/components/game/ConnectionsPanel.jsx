import React from 'react';
import { useGameContext } from '../../contexts/GameContext';
import { getImageUrlSync } from '../../services/tmdbService';
import { getItemTitle } from '../../utils/stringUtils';
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
  
  return (
    <div className="connections-panel">
      <div className="connections-header">
        <h2>{title}</h2>
        <button className="close-button" onClick={closeConnectionsPanel}>×</button>
      </div>
      
      <div className="connections-content">
        {nodeType === 'person' && (
          <>
            {connections.movies && connections.movies.length > 0 && (
              <div className="connection-section">
                <h3>Movies ({connections.movies.length})</h3>
                <div className="connections-grid">
                  {connections.movies.map((movie, index) => (
                    <div 
                      key={`movie-${movie.id}-${movie.credit_id || index}`}
                      className={`connection-item ${isItemOnBoard(movie, 'movie') ? 'already-on-board' : ''}`}
                    >
                      <div className="connection-image">
                        <img 
                          src={getImageUrlSync(movie.poster_path, 'poster')} 
                          alt={movie.title} 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
                        />
                      </div>
                      <div className="connection-info">
                        <div className="connection-title">{movie.title}</div>
                        <div className="connection-detail">
                          {movie.character && <span>as {movie.character}</span>}
                        </div>
                        {!isItemOnBoard(movie, 'movie') && (
                          <button 
                            className="add-connection-button"
                            onClick={() => handleAddToBoard(movie, 'movie')}
                          >
                            Add
                          </button>
                        )}
                        {isItemOnBoard(movie, 'movie') && (
                          <div className="on-board-indicator">On Board</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {connections.tvShows && connections.tvShows.length > 0 && (
              <div className="connection-section">
                <h3>TV Shows ({connections.tvShows.length})</h3>
                <div className="connections-grid">
                  {connections.tvShows.map((show, index) => (
                    <div 
                      key={`tv-${show.id}-${show.credit_id || index}`} 
                      className={`connection-item ${isItemOnBoard(show, 'tv') ? 'already-on-board' : ''} ${show.isGuestAppearance ? 'guest-appearance' : ''}`}
                    >
                      <div className="connection-image">
                        <img 
                          src={getImageUrlSync(show.poster_path, 'poster')} 
                          alt={show.name} 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
                        />
                        {show.isGuestAppearance && (
                          <div className="guest-badge">Guest</div>
                        )}
                      </div>
                      <div className="connection-info">
                        <div className="connection-title">{show.name}</div>
                        <div className="connection-detail">
                          {show.character && <span>as {show.character}</span>}
                        </div>
                        {!isItemOnBoard(show, 'tv') && (
                          <button 
                            className="add-connection-button"
                            onClick={() => handleAddToBoard(show, 'tv')}
                          >
                            Add
                          </button>
                        )}
                        {isItemOnBoard(show, 'tv') && (
                          <div className="on-board-indicator">On Board</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {(nodeType === 'movie' || nodeType === 'tv') && (
          <div className="connection-section">
            <h3>Cast {nodeType === 'tv' ? '(including Guest Stars)' : ''} ({connections.cast?.length || 0})</h3>
            <div className="connections-grid">
              {connections.cast && connections.cast.map((actor, index) => {
                const isGuestStar = actor.roles ? 
                  actor.roles.some(role => role.character && role.character.toLowerCase().includes('guest')) : 
                  (actor.character && actor.character.toLowerCase().includes('guest'));
                
                return (
                  <div 
                    key={`actor-${actor.id}-${actor.credit_id || actor.order || index}`} 
                    className={`connection-item ${isItemOnBoard(actor, 'person') ? 'already-on-board' : ''} ${isGuestStar ? 'guest-appearance' : ''}`}
                  >
                    <div className="connection-image">
                      <img 
                        src={getImageUrlSync(actor.profile_path, 'profile')} 
                        alt={actor.name} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
                      />
                      {isGuestStar && (
                        <div className="guest-badge">Guest</div>
                      )}
                    </div>
                    <div className="connection-info">
                      <div className="connection-title">{actor.name}</div>
                      <div className="connection-detail">
                        {actor.character && <span>as {actor.character}</span>}
                        {actor.roles && actor.roles.length > 0 && (
                          <span>as {actor.roles[0].character}</span>
                        )}
                      </div>
                      {!isItemOnBoard(actor, 'person') && (
                        <button 
                          className="add-connection-button"
                          onClick={() => handleAddToBoard(actor, 'person')}
                        >
                          Add
                        </button>
                      )}
                      {isItemOnBoard(actor, 'person') && (
                        <div className="on-board-indicator">On Board</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* If no connections are found */}
        {Object.values(connections).every(arr => !arr || arr.length === 0) && (
          <div className="no-connections">
            No connections found for this {
              nodeType === 'person' ? 'actor' : 
              nodeType === 'movie' ? 'movie' : 'TV show'
            }.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPanel;