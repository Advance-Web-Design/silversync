/**
 * StartScreen Component
 * 
 * This component serves as the initial screen of the game where users select their starting actors,
 * or switch to the Premade Challenges UI when the "Challenges" button is clicked.
 */
import React, { useState } from 'react';
import { useGameContext } from '../contexts/gameContext';
import ActorCard from './game/ActorCard';
import Menu from './Menu';
import LoadingOverlay from './game/LoadingOverlay';
import { useTheme } from '../contexts/ThemeContext';

const StartScreen = () => {

  // Extract game state and functions from GameContext
  const { 
    startActors,
    randomizeActors,
    startGame,
    isLoading,
    actorSearchResults,
    actorSearchTerms,
    searchStartActors,
    setActorSearch,
    selectStartActor,
    actorSearchPages,
    actorSearchTotalPages,
    startActorsError
  } = useGameContext();

  const { isLightMode, toggleTheme } = useTheme();

  // Handlers for actor-selection UI
  const handleSelectActor = (actorId, index) => {
    selectStartActor(actorId, index);
    setActorSearch('', index);
  };

  const loadMoreActors = (index) => {
    if (isLoading || actorSearchPages[index] >= actorSearchTotalPages[index]) return;
    searchStartActors(actorSearchTerms[index] || '', index, actorSearchPages[index] + 1);
  };

  const handleSearchAgain = (index) => {
    selectStartActor(null, index);
    setActorSearch('', index);
  };

  return (
    <div className={"relative min-h-screen overflow-hidden bg-cover bg-center bg-fixed text-black flex flex-col " +
      (isLightMode ? "bg-[url('/bg3.png')]" : "bg-[url('/bg2.png')]")}>
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4 w-full">
        <Menu parentName="StartScreen" />
        <h1 className="font-serif font-bold text-2xl sm:text-[2.75rem] text-[#ffd700] [text-shadow:0_0_8px_#ff4500] text-center flex-grow mr-8 sm:mr-0">
          Silver Sync
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 mx-auto h-full flex-grow w-full">
        {startActorsError && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded relative mb-3 sm:mb-4 text-xs sm:text-sm">
            {startActorsError}
          </div>
        )}

        {/* Actor Cards Container */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-around items-center sm:items-start w-full max-w-xs sm:max-w-lg md:max-w-2xl gap-6 sm:gap-4 m-4 sm:m-10 mb-6 sm:mb-12">
          {[0, 1].map((index) => (
            <div key={index} className="w-full sm:w-auto">
              <ActorCard
                index={index}
                selectedActor={startActors[index]}
                isLoading={isLoading}
                onSearchAgain={handleSearchAgain}

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
            </div>
          ))}
        </div>

        <div>
          {isLoading && <LoadingOverlay />}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[280px] sm:max-w-[300px] p-2 sm:p-4">
          <button
            onClick={startGame}
            disabled={!(startActors[0] && startActors[1]) || isLoading}
            className={"w-full cursor-pointer rounded-lg py-2 px-6 sm:py-[0.8rem] sm:px-8 text-base sm:text-[1.2rem] font-bold shadow-md transition-colors duration-300 " +
              (isLightMode
              ? "bg-[#6dd5f8] text-black hover:bg-cyan-500 disabled:bg-slate-300 disabled:text-slate-500"
              : "bg-[#2a9cc1] text-white hover:bg-cyan-900 disabled:bg-slate-600 disabled:text-slate-400")
}
          >
            START GAME
          </button> 
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
