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
import React from 'react';
import { useGameContext } from '../contexts/gameContext';
import ActorCard from './game/ActorCard';
import Menu from './Menu';
import LoadingOverlay from './game/LoadingOverlay'
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
    setActorSearch('', index);
  };
  
  /**
   * Loads more actor search results when user scrolls through results
   * Increments the current page number for the specified actor search
   * 
   * @param {number} index - Index of the actor position (0 or 1)
   */
  const loadMoreActors = (index) => {
    if (isLoading || actorSearchPages[index] >= actorSearchTotalPages[index]) return;
    // Ensure actorSearchTerms[index] is used for loading more
    searchStartActors(actorSearchTerms[index] || '', index, actorSearchPages[index] + 1);
  };

  /**
   * Handles "change actor" button to clear an actor selection
   * Focuses the search input after clearing
   * 
   * @param {number} index - Index of the actor position to clear (0 or 1)
   */
  const handleSearchAgain = (index) => {
    selectStartActor(null, index);
    setActorSearch('', index);
  };

  return (
    <div className="relative min-h-screen bg-[url('/bg2.png')] bg-cover bg-center bg-fixed  text-black">

      {/* Header with game title and menu button */}
      <div className="flex justify-between items-center p-4 w-full">
        {/* Menu button on top left */}
        <Menu parentName={'StartScreen'} />
        
        {/* Title on top right */}
        <h1 className="font-serif font-bold text-[2.75rem] text-[#ffd700] [text-shadow:0_0_8px_#ff4500]">
          Connect The Stars
        </h1>
      </div>
      {/* Main content area */}
      <div className="flex flex-col items-center justify-center p-8  mx-auto h-full">
        {/* Error message display */}
        {startActorsError && (
          <div className="error-message">
            {startActorsError}
          </div>
        )}

        {/* Actor selection cards - one for each starting position */}
        <div className="flex flex-wrap justify-around w-full max-w-lg m-10 mb-12">
          {[0, 1].map((index) => (
            <ActorCard
              key={index}
              index={index}
              selectedActor={startActors[index]}
              isLoading={isLoading}
              onSearchAgain={handleSearchAgain}

              // Data for ActorSelectionSlot (passed via ActorCard)
              initialSearchTerm={actorSearchTerms[index]}
              currentActorSearchResults={actorSearchResults[index]}
              searchPageNum={actorSearchPages[index]}
              searchTotalPages={actorSearchTotalPages[index]}

              callbackOnSelectActor={handleSelectActor}
              callbackOnLoadMore={loadMoreActors}
              callbackOnRandomize={randomizeActors}
              callbackSearchActors={searchStartActors}
              callbackUpdateSearchTerm={setActorSearch}
            />
          ))}
        </div>
        
        <div > {/* add padding here to buffer the loading overlay*/}
          {isLoading && <LoadingOverlay />} {/* Add LoadingOverlay here */}
        </div>
        
        {/* Game control buttons at the bottom */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[300px] p-4">
          {/* Start game button - only enabled when two actors are selected */}
          <button
            className="w-full cursor-pointer rounded-lg bg-cyan-400 py-[0.8rem] px-8 text-[1.2rem] font-bold text-white shadow-md transition-colors duration-300 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            
            //className='!bg-[#ffb347] !text-black disabled:bg-blue-500 disabled:text-green-400 hover:bg-pink-500'
            onClick={startGame}
            disabled={!(startActors[0] && startActors[1]) || isLoading}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;