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
import './StartScreen.css';

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
    <div className="relative min-h-screen bg-[url('/bg2.png')] bg-cover bg-center bg-fixed text-black">
      {/* Header */}
      <div className="flex justify-between items-center p-4 w-full">
        <Menu parentName="StartScreen" />
        <h1 className="font-serif font-bold text-[2.75rem] text-[#ffd700] [text-shadow:0_0_8px_#ff4500]">
          Connect The Stars
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center p-8 mx-auto h-full">
        {startActorsError && (
          <div className="error-message">
            {startActorsError}
          </div>
        )}

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

        <div>
          {isLoading && <LoadingOverlay />}
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[300px] p-4">
          <button
            onClick={startGame}
            disabled={!(startActors[0] && startActors[1]) || isLoading}
            className="w-full cursor-pointer rounded-lg bg-[#4bbee3] py-[0.8rem] px-8 text-[1.2rem] font-bold text-white shadow-md transition-colors duration-300 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            START GAME
          </button> 
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
