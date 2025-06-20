import React from 'react';
import ActorSelectionSlot from './ActorSelectionSlot';
import { getImageUrl } from '../../utils/tmdbUtils';
import * as actorCardStyles from '../../styles/ActorsCardStyle.js'; 
import { useTheme } from '../../contexts/ThemeContext';



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
  const { isLightMode, toggleTheme } = useTheme();

  return (
    <div className={actorCardStyles.actorCardBaseStyle + " " +
      (isLightMode ? actorCardStyles.actorCardLightStyle : actorCardStyles.actorCardDarkStyle)}>
      {selectedActor ? (
        <div className={actorCardStyles.actorContainerStyle}>
          {/* Image container with fixed height */}
          <div className={actorCardStyles.actorImageContainerStyle}>
            <img
              className={actorCardStyles.actorImageStyle}
              src={getImageUrl(selectedActor.profile_path, 'profile')}
              alt={selectedActor.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
          </div>
          <div className={actorCardStyles.actorNameBaseStyle + " " +
            (isLightMode ? actorCardStyles.actorNameLightStyle : actorCardStyles.actorNameDarkStyle)}>
            {selectedActor.name}
          </div>
          
          {/* Auto-expanding spacer */}
          <div className="flex-grow"></div>
          
          {/* Button in fixed position at bottom */}
          <div className="w-full mt-auto">
            <button 
              className={actorCardStyles.actorSearchButtonBaseStyle + " " +
                (isLightMode ? actorCardStyles.actorSearchButtonLightStyle : actorCardStyles.actorSearchButtonDarkStyle)}
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