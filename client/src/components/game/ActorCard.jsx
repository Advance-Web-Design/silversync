import React from 'react';
import ActorSelectionSlot from './ActorSelectionSlot';
import { getImageUrlSync } from '../../services/tmdbService';
import * as actorCardStyles from '../../styles/ActorsCardStyle.js'; 

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
    <div className={actorCardStyles.actorCardStyle}>
      {selectedActor ? (
        <div className={actorCardStyles.actorContainerStyle}>
          {/* Image container with fixed height */}
          <div className={actorCardStyles.actorImageContainerStyle}>
            <img
              className={actorCardStyles.actorImageStyle}
              src={getImageUrlSync(selectedActor.profile_path, 'profile')}
              alt={selectedActor.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
          </div>
          <div className={actorCardStyles.actorNameStyle}>
            {selectedActor.name}
          </div>
          
          {/* Auto-expanding spacer */}
          <div className="flex-grow"></div>
          
          {/* Button in fixed position at bottom */}
          <div className="w-full mt-auto">
            <button 
              className={actorCardStyles.actorSearchButtonStyle}
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