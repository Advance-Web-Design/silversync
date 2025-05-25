import React from 'react';
import ActorSelectionSlot from './ActorSelectionSlot';
import { getImageUrlSync } from '../../services/tmdbService';

const ActorCard = ({
  index,
  selectedActor,
  isLoading, // Global loading state
  onSearchAgain, // For "Change Actor" button

  // Props for ActorSelectionSlot (passed down from StartScreen)
  initialSearchTerm,
  currentActorSearchResults,
  searchPageNum,
  searchTotalPages,
  callbackOnSelectActor,
  callbackOnLoadMore,
  callbackOnRandomize,
  callbackSearchActors,
  callbackUpdateSearchTerm,
}) => {
  return (
    <div className="relative flex min-h-[325px] w-[230px] flex-col text-white items-center rounded-xl bg-slate-800 p-4 shadow-lg shadow-cyan-500/25 border-2 border-cyan-400">
      {selectedActor ? (
        <div className="flex flex-col h-full w-full">
          {/* Image container with fixed height */}
          <div className="h-[200px] w-[150px] overflow-hidden rounded mt-2 mb-4 mx-auto border border-slate-600">
            <img
              className="h-full w-full object-cover"
              src={getImageUrlSync(selectedActor.profile_path, 'profile')}
              alt={selectedActor.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
          </div>
          
          {/* Name with fixed height */}
          <div className="w-full h-[60px] px-2 text-center flex items-center justify-center">
            <span className="text-[1.2rem] font-bold text-slate-100 line-clamp-2">
              {selectedActor.name}
            </span>
          </div>
          
          {/* Auto-expanding spacer */}
          <div className="flex-grow"></div>
          
          {/* Button in fixed position at bottom */}
          <div className="w-full mt-auto">
            <button 
              className="w-full cursor-pointer rounded-md border-none bg-cyan-600 px-6 py-2 text-white transition-colors duration-300 hover:bg-cyan-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
              onClick={() => onSearchAgain(index)}
              disabled={isLoading}
            >
              Change Actor
            </button>
          </div>
        </div>
      ) : (
        <ActorSelectionSlot
          index={index}
          isLoading={isLoading}
          initialSearchTermFromContext={initialSearchTerm}
          currentActorSearchResultsFromContext={currentActorSearchResults}
          searchPageNumFromContext={searchPageNum}
          searchTotalPagesFromContext={searchTotalPages}
          onSelectActorCallback={callbackOnSelectActor}
          onLoadMoreCallback={callbackOnLoadMore}
          onRandomizeCallback={callbackOnRandomize}
          searchActorsCallback={callbackSearchActors}
          updateSearchTermInContextCallback={callbackUpdateSearchTerm}
        />
      )}
    </div>
  );
};

export default ActorCard;