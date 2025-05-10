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
import React from 'react'; // Removed useEffect, useRef, useState, useMemo
import { useGameContext } from '../../contexts/gameContext'; // Corrected import path
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
  
  /**
   * Handles actor selection from search results
   * Selects the actor and clears the search term
   * 
   * @param {number} actorId - ID of the selected actor
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const handleSelectActor = (actorId, index) => {
    selectStartActor(actorId, index);
    setActorSearch('', index); // Clear the search term in context for this slot
    // Local search term update will be handled by ActorSelectionSlot via prop changes
  };
  
  /**
   * Loads more actor search results when user scrolls through results
   * Increments the current page number for the specified actor search
   * 
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const loadMoreActors = (index) => {
    if (isLoading || actorSearchPages[index] >= actorSearchTotalPages[index]) return;
    // Ensure actorSearchTerms[index] is used for loading more, as localSearchTerms is removed
    searchStartActors(actorSearchTerms[index] || '', index, actorSearchPages[index] + 1);
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
    setActorSearch('', index); // Clear the search term in context
    // Focus logic is now handled by ActorSelectionSlot when it becomes visible
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
              isLoading={isLoading} // Global loading state
              onSearchAgain={handleSearchAgain} // For "Change Actor" button in ActorCard

              // Data for ActorSelectionSlot (passed via ActorCard)
              initialSearchTerm={actorSearchTerms[index]}
              currentActorSearchResults={actorSearchResults[index]}
              searchPageNum={actorSearchPages[index]}
              searchTotalPages={actorSearchTotalPages[index]}
              
              // Callbacks for ActorSelectionSlot (passed via ActorCard)
              // ActorCard will adapt these for ActorSelectionSlot, adding index where necessary
              // or ActorSelectionSlot will use its own index prop with these.
              callbackOnSelectActor={handleSelectActor}
              callbackOnLoadMore={loadMoreActors}
              callbackOnRandomize={randomizeActors} // from context, already takes index
              callbackSearchActors={searchStartActors} // from context
              callbackUpdateSearchTerm={setActorSearch} // from context
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