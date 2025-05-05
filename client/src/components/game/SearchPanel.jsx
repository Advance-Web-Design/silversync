import React, { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../../contexts/GameContext';
import './SearchPanel.css';
import { getItemTitle } from '../../utils/stringUtils';
import SearchEntitiesSidebar from './SearchEntitiesSidebar';

const SearchPanel = () => {
  const {
    searchTerm,
    setSearchTerm,
    handleSearch,
    searchResults,
    isLoading,
    connectableItems,
    didYouMean,
    originalSearchTerm,
    addToBoard,
    noMatchFound,
    useSpellingCorrection,
    showAllSearchable
  } = useGameContext();
  
  const [inputFocused, setInputFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  
  useEffect(() => {
    // Focus the search input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Determine if search has results AND there's an active search term
  const hasResults = searchResults && searchResults.length > 0 && searchTerm.trim() !== '';

  // Filter and organize search results
  const organizedResults = React.useMemo(() => {
    if (!searchResults || searchResults.length === 0) return { connectable: [], notConnectable: [] };
    
    // Categorize results by connectivity
    const connectable = [];
    const notConnectable = [];
    
    searchResults.forEach(item => {
      const itemKey = `${item.media_type}-${item.id}`;
      if (connectableItems[itemKey]) {
        connectable.push(item);
      } else {
        notConnectable.push(item);
      }
    });
    
    return { connectable, notConnectable };
  }, [searchResults, connectableItems]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  };
  
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    
    // If the search term is emptied, clear the search results in the context
    if (e.target.value.trim() === '') {
      // Reset all search-related states when the input is cleared
      if (typeof useGameContext().setSearchResults === 'function') {
        useGameContext().setSearchResults([]);
      }
      // Also reset the suggestion and no match found states
      setNoMatchFound(false);
      setDidYouMean(null);
      setExactMatch(null);
    }
  };
  
  const handleAddToBoard = (item) => {
    addToBoard(item);
    
    // Clear search results and term after adding to board
    setSearchTerm('');
    
    // Also clear the search results in the context to collapse the panel
    if (typeof useGameContext().setSearchResults === 'function') {
      useGameContext().setSearchResults([]);
    }
    
    // Focus back on the input after clicking
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Update sidebar open state when showAllSearchable changes in context
  useEffect(() => {
    setSidebarOpen(showAllSearchable);
  }, [showAllSearchable]);

  // Only show results section if we have a search term and results
  const shouldShowResults = !isLoading && hasResults && searchTerm.trim() !== '';

  return (
    <div className={`search-panel-container ${hasResults ? 'with-results' : ''}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          ref={inputRef}
          className="in-game-search-input"
          type="text"
          placeholder="Search movies, TV shows, actors..."
          value={searchTerm}
          onChange={handleInputChange}
          autoFocus
        />
        <button
          type="submit"
          className="in-game-search-button"
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {/* Enhanced Did You Mean section */}
      {didYouMean && originalSearchTerm && (
        <div className="in-game-search-suggestion">
          <p className="suggestion-title">
            Did you mean:
          </p>
          <div className="suggestion-content">
            {typeof didYouMean === 'string' ? (
              <button 
                onClick={useSpellingCorrection}
                className="suggestion-button text-only"
              >
                {didYouMean}
              </button>
            ) : (
              <button 
                onClick={useSpellingCorrection}
                className={`suggestion-button entity-suggestion ${didYouMean.isConnectable ? 'connectable' : ''}`}
              >
                <div className="suggestion-image">
                  <img 
                    src={`https://image.tmdb.org/t/p/w92${didYouMean.media_type === 'person' ? didYouMean.profile_path : didYouMean.poster_path}`} 
                    alt={getItemTitle(didYouMean)}
                  />
                </div>
                <div className="suggestion-info">
                  <span className="suggestion-name">{getItemTitle(didYouMean)}</span>
                  <span className="suggestion-type">
                    {didYouMean.media_type === 'movie' ? 'Movie' : 
                     didYouMean.media_type === 'tv' ? 'TV Show' : 'Actor'}
                    {didYouMean.isConnectable && 
                      <span className="connectable-tag"> (Can be added to board)</span>
                    }
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* No Results Message */}
      {noMatchFound && (
        <div className="in-game-search-no-results">
          <p>No matches found for "{originalSearchTerm}"</p>
          <p style={{ fontSize: 'smaller' }}>Try a different search term or check your spelling.</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="in-game-search-loading">
          Searching...
        </div>
      )}
      
      {/* Search Results - only show if we have search term and results */}
      {shouldShowResults && (
        <div className="in-game-search-results" ref={resultsContainerRef}>
          {/* Only show connectable results - no need to separate into categories */}
          {organizedResults.connectable.map(item => (
            <div
              key={`${item.media_type}-${item.id}`}
              className={`in-game-result-item ${connectableItems[`${item.media_type}-${item.id}`] ? 'can-connect' : ''}`}
              onClick={() => handleAddToBoard(item)}
            >
              <div className="in-game-result-image">
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.media_type === 'person' ? item.profile_path : item.poster_path}`}
                  alt={getItemTitle(item)}
                />
              </div>
              <div className="in-game-result-info">
                <div className="in-game-result-title">{getItemTitle(item)}</div>
                <div className="in-game-result-type">
                  {item.media_type === 'movie' ? 'Movie' : item.media_type === 'tv' ? 'TV Show' : 'Actor'}
                  {/* Show guest appearance tag if applicable */}
                  {item.media_type === 'tv' && (item.is_guest_appearance || item.hasGuestAppearances) && 
                    <span style={{ color: '#FFC107' }}> (Guest)</span>
                  }
                  {item.media_type === 'person' && item.is_guest_star && 
                    <span style={{ color: '#FFC107' }}> (Guest)</span>
                  }
                </div>
              </div>
              <button 
                className="in-game-add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToBoard(item);
                }}
              >
                Add
              </button>
            </div>
          ))}
          
          {/* Show message if no connectable items */}
          {organizedResults.connectable.length === 0 && organizedResults.notConnectable.length > 0 && (
            <div className="in-game-search-no-results">
              <p>Found matches, but none can be connected to the board.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Search Entities Sidebar */}
      <SearchEntitiesSidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />
    </div>
  );
};

export default SearchPanel;