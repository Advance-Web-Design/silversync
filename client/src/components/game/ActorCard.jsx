import React from 'react';
import ActorSearchInterface from './ActorSearchInterface';
import { getImageUrlSync } from '../../services/tmdbService';

const ActorCard = ({
  index,
  selectedActor,
  isLoading,
  onSearchAgain,
  // Props for ActorSearchInterface
  localSearchTerm,
  onSearchChange,
  onInputFocus,
  onInputBlur,
  searchInputRef,
  activeInputIndex,
  actorSearchResultsList,
  onSelectActor,
  actorSearchPageNum,
  actorSearchTotalPagesNum,
  onLoadMore,
  onRandomize,
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
        <ActorSearchInterface
          index={index}
          isLoading={isLoading}
          localSearchTerm={localSearchTerm}
          onSearchChange={onSearchChange}
          onInputFocus={onInputFocus}
          onInputBlur={onInputBlur}
          searchInputRef={searchInputRef}
          activeInputIndex={activeInputIndex}
          actorSearchResultsList={actorSearchResultsList}
          onSelectActor={onSelectActor}
          actorSearchPageNum={actorSearchPageNum}
          actorSearchTotalPagesNum={actorSearchTotalPagesNum}
          onLoadMore={onLoadMore}
          onRandomize={onRandomize}
        />
      )}
    </div>
  );
};

export default ActorCard;