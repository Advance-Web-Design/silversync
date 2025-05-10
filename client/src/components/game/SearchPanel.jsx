import React, { useState, useRef, useEffect } from 'react';
import { useGameContext } from '../../contexts/gameContext';
import './SearchPanel.css';
import SearchPanelUI from './SearchPanelUI';
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
    showAllSearchable,
    setSearchResults,
    setNoMatchFound,
    setDidYouMean,
    setExactMatch
  } = useGameContext();
  
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
      if (typeof setSearchResults === 'function') {
        setSearchResults([]);
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
    if (typeof setSearchResults === 'function') {
      setSearchResults([]);
    }
    
    // Reset search feedback states from context
    setNoMatchFound(false);
    setDidYouMean(null);
    setExactMatch(null);

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
    <> {/* Use a fragment to wrap SearchPanelUI and SearchEntitiesSidebar */}
      <SearchPanelUI
        handleSubmit={handleSubmit}
        inputRef={inputRef}
        searchTerm={searchTerm}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
        hasResults={hasResults}
        didYouMean={didYouMean}
        originalSearchTerm={originalSearchTerm}
        useSpellingCorrection={useSpellingCorrection}
        noMatchFound={noMatchFound}
        shouldShowResults={shouldShowResults}
        resultsContainerRef={resultsContainerRef}
        organizedResults={organizedResults}
        connectableItems={connectableItems}
        handleAddToBoard={handleAddToBoard}
      />
      
{ /*==================================================================================*/}
                { /* remove this part before final release!!! */}

      <SearchEntitiesSidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 

      />
{ /*==================================================================================*/}
    </>
  );
};

export default SearchPanel;