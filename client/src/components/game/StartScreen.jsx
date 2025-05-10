/**
 * StartScreen Component
 * 
 * This component serves as the initial screen of the game where users select their starting actors.
 * It allows users to:
 * - Search for actors by name
 * - Select random actors
 * - Select actors from search results
 * - Start the game once two actors are selected
 * 
 * The component uses debounced search to improve performance and uses local state
 * to keep the UI responsive during searches.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { useGameContext } from '../../contexts/gameContext';
import ActorCard from './ActorCard';
import MenuIcon from '@mui/icons-material/Menu';
import './StartScreen.css';

const StartScreen = () => {
  // Extract game state and functions from GameContext
  const { 
    startActors,           // Array containing the two selected starting actors
    randomizeActors,       // Function to select a random actor for a position
    startGame,             // Function to begin the game with selected actors
    isLoading,             // Loading state indicator for API calls
    actorSearchResults,    // Search results for actor queries
    actorSearchTerms,      // Current search terms for each actor position
    searchStartActors,     // Function to search for actors
    setActorSearch,        // Function to update the actor search term
    selectStartActor,      // Function to select an actor for a position
    actorSearchPages,      // Current page number for each actor search
    actorSearchTotalPages, // Total pages available for each actor search
    startActorsError       // Error message for actor selection
  } = useGameContext();
  
  // Memoize searchInputRefs to prevent useEffect from re-running unnecessarily
  const searchInputRefs = useMemo(() => [React.createRef(), React.createRef()], []);
  
  // Local state for search input values to prevent UI from clearing during typing
  const [localSearchTerms, setLocalSearchTerms] = useState(['', '']);
  
  // Track which input is currently focused (0, 1, or null)
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  
  // Debounce timer references to delay API calls while typing
  const searchTimers = useRef([null, null]);
  
  /**
   * Effect to synchronize local search terms with context search terms
   * This ensures the UI stays in sync with the global state
   */
  useEffect(() => {
    setLocalSearchTerms([actorSearchTerms[0] || '', actorSearchTerms[1] || '']);
  }, [actorSearchTerms]);
  
  /**
   * Effect to restore focus after loading or search result updates
   * Maintains the same input focus after asynchronous operations complete
   */
  useEffect(() => {
    if (isLoading) return;

    // Focus on the first empty input field or the active one
    const activeIndex = activeInputIndex !== null ? activeInputIndex : startActors.findIndex(actor => !actor);
    if (activeIndex !== -1 && searchInputRefs[activeIndex] && searchInputRefs[activeIndex].current) {
      searchInputRefs[activeIndex].current.focus();
    }
  }, [isLoading, actorSearchResults, activeInputIndex, startActors, searchInputRefs]); // searchInputRefs is now stable

  /**
   * Handles search input changes with debouncing
   * Updates local state immediately for responsive UI
   * Delays API calls until user stops typing
   * 
   * @param {Event} e - Input change event
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const handleSearchChange = (e, index) => {
    const value = e.target.value;
    
    // Update local state immediately for responsive UI feedback
    setLocalSearchTerms(prev => {
      const newTerms = [...prev];
      newTerms[index] = value;
      return newTerms;
    });
    
    // Clear previous timer to implement debouncing
    if (searchTimers.current[index]) {
      clearTimeout(searchTimers.current[index]);
    }
    
    // Set new timer to update search after typing pauses
    searchTimers.current[index] = setTimeout(() => {
      setActorSearch(value, index);
      searchStartActors(value, index);
    }, 300); // 300ms debounce delay
  };

  /**
   * Handles input focus to track which search field is active
   * @param {number} index - Index of the focused input (0 or 1)
   */
  const handleInputFocus = (index) => {
    setActiveInputIndex(index);
  };

  /**
   * Handles input blur events with a delay to prevent
   * losing focus when clicking on search results
   * 
   * @param {Event} e - Blur event object
   */
  const handleInputBlur = (e) => {
    // Only clear activeInputIndex if we're not clicking on a search result
    // This prevents the dropdown from disappearing before the click is processed
    if (!e.relatedTarget || !e.relatedTarget.classList.contains('actor-search-item')) {
      // Small delay to allow click events on search results to process first
      setTimeout(() => setActiveInputIndex(null), 100);
    }
  };

  /**
   * Handles actor selection from search results
   * Selects the actor and clears the search term
   * 
   * @param {number} actorId - ID of the selected actor
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const handleSelectActor = (actorId, index) => {
    selectStartActor(actorId, index);
    // Clear search after selection
    setActorSearch('', index);
    setLocalSearchTerms(prev => {
      const newTerms = [...prev];
      newTerms[index] = '';
      return newTerms;
    });
    setActiveInputIndex(null);
  };
  
  /**
   * Loads more actor search results when user scrolls through results
   * Increments the current page number for the specified actor search
   * 
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const loadMoreActors = (index) => {
    if (actorSearchPages[index] < actorSearchTotalPages[index]) {
      searchStartActors(actorSearchTerms[index], index, actorSearchPages[index] + 1);
    }
  };

  /**
   * Handles menu button click (placeholder for future menu functionality)
   */
  const handleMenuClick = () => {
    // Menu functionality placeholder
    console.log('Menu clicked');
  };

  /**
   * Handles "change actor" button to clear an actor selection
   * Focuses the search input after clearing
   * 
   * @param {number} index - Index of the actor position to clear (0 or 1)
   */
  const handleSearchAgain = (index) => {
    selectStartActor(null, index);
    // Focus the search input after clicking "Change Actor"
    setTimeout(() => {
      if (searchInputRefs[index] && searchInputRefs[index].current) {
        searchInputRefs[index].current.focus();
        setActiveInputIndex(index);
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-black text-white relative"
      style={{
        backgroundImage: 'url("/stars-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>

      {/* Header with game title and menu button */}
      <div className="flex justify-between items-center p-4 w-full">
        {/* Title on top left */}
        <h1 style={{ 
          fontFamily: 'serif', 
          color: 'gold', 
          fontWeight: 'bold',
          fontSize: '1.75rem'
        }}>
          Connect The Stars
        </h1>
        
        {/* Menu button on top right */}
        <button 
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <MenuIcon /> Menu
        </button>
      </div>
      
      {/* Main content area */}
      <div className="start-screen">
        {/* Error message display */}
        {startActorsError && (
          <div className="error-message">
            {startActorsError}
          </div>
        )}

        {/* Actor selection cards - one for each starting position */}
        <div className="actors-selection">
          {[0, 1].map((index) => (
            <ActorCard
              key={index}
              index={index}
              selectedActor={startActors[index]}
              isLoading={isLoading}
              onSearchAgain={handleSearchAgain}
              // Props for ActorSearchInterface
              localSearchTerm={localSearchTerms[index]}
              onSearchChange={handleSearchChange}
              onInputFocus={handleInputFocus}
              onInputBlur={handleInputBlur}
              searchInputRef={searchInputRefs[index]}
              activeInputIndex={activeInputIndex}
              actorSearchResultsList={actorSearchResults[index]}
              onSelectActor={handleSelectActor}
              actorSearchPageNum={actorSearchPages[index]}
              actorSearchTotalPagesNum={actorSearchTotalPages[index]}
              onLoadMore={loadMoreActors}
              onRandomize={randomizeActors} // Pass the randomizeActors function directly
            />
          ))}
        </div>
        
        {/* Game control buttons at the bottom */}
        <div className="game-actions">
          {/* Button to randomize both actors at once */}
          <button 
            className="randomize-all-btn"
            onClick={() => {
              randomizeActors(0);
              randomizeActors(1);
            }}
            disabled={isLoading}
          >
            Random Both Actors
          </button>
          
          {/* Start game button - only enabled when two actors are selected */}
          <button
            className="start-game-btn"
            onClick={startGame}
            disabled={!(startActors[0] && startActors[1]) || isLoading}
            style={{ backgroundColor: 'gold', color: 'black' }}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;