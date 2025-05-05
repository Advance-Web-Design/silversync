import React from 'react';
import { useGameContext } from '../../contexts/GameContext';
import './SearchEntitiesSidebar.css';
import { getItemTitle } from '../../utils/stringUtils';

const SearchEntitiesSidebar = ({ isOpen, onClose }) => {
  const { 
    searchResults, 
    connectableItems,
    addToBoard,
    isLoading,
    toggleShowAllSearchable,
    nodes
  } = useGameContext();

  if (!isOpen) return null;

  // Organize search results to only show connectable items
  const connectableEntities = React.useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];
    
    return searchResults.filter(item => {
      const itemKey = `${item.media_type}-${item.id}`;
      return connectableItems[itemKey]; // Only include items that can be connected
    });
  }, [searchResults, connectableItems]);

  // Handle adding an item to the board
  const handleAddToBoard = (item) => {
    addToBoard(item);
    // No need to close sidebar after adding - let user continue browsing
  };

  // Close the sidebar and toggle the state in context
  const handleClose = () => {
    toggleShowAllSearchable(); // This will set showAllSearchable to false
    onClose();
  };

  // Group entities by type for better organization
  const groupedEntities = React.useMemo(() => {
    const groups = {
      person: [],
      movie: [],
      tv: []
    };
    
    connectableEntities.forEach(item => {
      if (groups[item.media_type]) {
        groups[item.media_type].push(item);
      }
    });
    
    // Sort each group by name/title
    groups.person.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    groups.movie.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    groups.tv.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    
    return groups;
  }, [connectableEntities]);

  // Find the source node(s) that an entity can connect with
  const getConnectedNodes = (item) => {
    // If entity has source_node property directly (from fetchAndSetAllSearchableEntities)
    if (item.source_node) {
      const sourceNode = nodes.find(node => node.id === item.source_node);
      if (sourceNode) {
        return [sourceNode];
      }
    }

    // Otherwise determine based on media type
    const connectedNodes = [];
    
    // For a person, check which movie or TV show nodes they connect with
    if (item.media_type === 'person') {
      // Check movie credits
      const movieNodes = nodes.filter(node => node.type === 'movie');
      movieNodes.forEach(movieNode => {
        const cast = movieNode.data.credits?.cast || [];
        if (cast.some(actor => actor.id === item.id)) {
          connectedNodes.push(movieNode);
        }
      });
      
      // Check TV show credits
      const tvNodes = nodes.filter(node => node.type === 'tv');
      tvNodes.forEach(tvNode => {
        const cast = tvNode.data.credits?.cast || [];
        const guestStars = tvNode.data.guest_stars || [];
        if (cast.some(actor => actor.id === item.id) || 
            guestStars.some(actor => actor.id === item.id)) {
          connectedNodes.push(tvNode);
        }
      });
    } 
    // For a movie/TV, check which actor nodes have appeared in it
    else if (item.media_type === 'movie' || item.media_type === 'tv') {
      const actorNodes = nodes.filter(node => node.type === 'person');
      actorNodes.forEach(actorNode => {
        // For movies, check movie credits
        if (item.media_type === 'movie' && actorNode.data.movie_credits?.cast) {
          if (actorNode.data.movie_credits.cast.some(movie => movie.id === item.id)) {
            connectedNodes.push(actorNode);
          }
        }
        // For TV shows, check TV credits and guest appearances
        else if (item.media_type === 'tv') {
          const hasRegularAppearance = actorNode.data.tv_credits?.cast &&
            actorNode.data.tv_credits.cast.some(show => show.id === item.id);
          
          const hasGuestAppearance = actorNode.data.guest_appearances &&
            actorNode.data.guest_appearances.some(show => show.id === item.id);
          
          if (hasRegularAppearance || hasGuestAppearance) {
            connectedNodes.push(actorNode);
          }
        }
      });
    }
    
    return connectedNodes;
  };

  return (
    <div className="search-entities-sidebar-overlay">
      <div className="search-entities-sidebar">
        <div className="search-entities-sidebar-header">
          <h3>Connectable Entities</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        <div className="search-entities-sidebar-content">
          {isLoading ? (
            <div className="search-entities-loading">Loading connectable entities...</div>
          ) : (
            <>
              {connectableEntities.length > 0 ? (
                <>
                  {/* Actors Section */}
                  {groupedEntities.person.length > 0 && (
                    <div className="entity-type-section person">
                      <h4>Actors ({groupedEntities.person.length})</h4>
                      <div className="search-entities-list">
                        {groupedEntities.person.map(item => {
                          const connectedNodes = getConnectedNodes(item);
                          return (
                            <div
                              key={`${item.media_type}-${item.id}`}
                              className="search-entity-item connectable"
                              onClick={() => handleAddToBoard(item)}
                            >
                              <div className="search-entity-image">
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${item.profile_path}`}
                                  alt={getItemTitle(item)}
                                />
                              </div>
                              <div className="search-entity-info">
                                <div className="search-entity-title">{getItemTitle(item)}</div>
                                <div className="search-entity-type">
                                  Actor
                                  {item.is_guest_star && 
                                    <span className="guest-tag"> (Guest)</span>
                                  }
                                </div>
                                {connectedNodes.length > 0 && (
                                  <div className="source-node-indicator">
                                    Connects with: {connectedNodes.map(node => getItemTitle(node.data)).join(', ')}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="add-to-board-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToBoard(item);
                                }}
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Movies Section */}
                  {groupedEntities.movie.length > 0 && (
                    <div className="entity-type-section movie">
                      <h4>Movies ({groupedEntities.movie.length})</h4>
                      <div className="search-entities-list">
                        {groupedEntities.movie.map(item => {
                          const connectedNodes = getConnectedNodes(item);
                          return (
                            <div
                              key={`${item.media_type}-${item.id}`}
                              className="search-entity-item connectable"
                              onClick={() => handleAddToBoard(item)}
                            >
                              <div className="search-entity-image">
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                  alt={getItemTitle(item)}
                                />
                              </div>
                              <div className="search-entity-info">
                                <div className="search-entity-title">{getItemTitle(item)}</div>
                                <div className="search-entity-type">Movie</div>
                                {connectedNodes.length > 0 && (
                                  <div className="source-node-indicator">
                                    Connects with: {connectedNodes.map(node => getItemTitle(node.data)).join(', ')}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="add-to-board-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToBoard(item);
                                }}
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TV Shows Section */}
                  {groupedEntities.tv.length > 0 && (
                    <div className="entity-type-section tv">
                      <h4>TV Shows ({groupedEntities.tv.length})</h4>
                      <div className="search-entities-list">
                        {groupedEntities.tv.map(item => {
                          const connectedNodes = getConnectedNodes(item);
                          return (
                            <div
                              key={`${item.media_type}-${item.id}`}
                              className="search-entity-item connectable"
                              onClick={() => handleAddToBoard(item)}
                            >
                              <div className="search-entity-image">
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                  alt={getItemTitle(item)}
                                />
                              </div>
                              <div className="search-entity-info">
                                <div className="search-entity-title">{getItemTitle(item)}</div>
                                <div className="search-entity-type">
                                  TV Show
                                  {(item.is_guest_appearance || item.hasGuestAppearances) && 
                                    <span className="guest-tag"> (Guest)</span>
                                  }
                                </div>
                                {connectedNodes.length > 0 && (
                                  <div className="source-node-indicator">
                                    Connects with: {connectedNodes.map(node => getItemTitle(node.data)).join(', ')}
                                  </div>
                                )}
                              </div>
                              <button 
                                className="add-to-board-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToBoard(item);
                                }}
                              >
                                Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-entities-message">
                  <p>No connectable entities available.</p>
                  <p>There are no movies, TV shows, or actors that can be connected to the board at this moment.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchEntitiesSidebar;