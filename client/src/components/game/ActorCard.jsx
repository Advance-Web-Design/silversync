import React from 'react';
// import ActorSearchInterface from './ActorSearchInterface'; // No longer directly used
import ActorSelectionSlot from './ActorSelectionSlot'; // Import the new component
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
  // Removed props that were for ActorSearchInterface directly:
  // localSearchTerm,
  // onSearchChange,
  // onInputFocus,
  // onInputBlur,
  // searchInputRef,
  // activeInputIndex,
  // actorSearchResultsList, // Renamed to currentActorSearchResults for clarity
  // onSelectActor, // Renamed to callbackOnSelectActor
  // actorSearchPageNum, // Renamed to searchPageNum
  // actorSearchTotalPagesNum, // Renamed to searchTotalPages
  // onLoadMore, // Renamed to callbackOnLoadMore
  // onRandomize, // Renamed to callbackOnRandomize
}) => {
  return (
    <div className="actor-card">
      {selectedActor ? (
        <>
          <div className="actor-image">
            <img
              src={getImageUrlSync(selectedActor.profile_path, 'profile')}
              alt={selectedActor.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
          </div>
          <div className="actor-name">
            {selectedActor.name}
          </div>
          <button 
            className="search-again-btn"
            onClick={() => onSearchAgain(index)}
            disabled={isLoading}
          >
            Change Actor
          </button>
        </>
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