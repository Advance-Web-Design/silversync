import React from 'react';
import { getImageUrlSync } from '../../services/tmdbService';

const ActorSearchInterface = ({
  index,
  isLoading,
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
    <>
      <div className="loading-actor">
        {isLoading && activeInputIndex !== index ? 'Loading...' : 'Select an actor'}
      </div>
      
      <div className="actor-search-panel">
        <input
          ref={searchInputRef}
          type="text"
          className="w-full py-2.5 px-2.5 rounded border border-gray-300 text-base mb-1.5"
          placeholder="Search actor name..."
          value={localSearchTerm}
          onChange={onSearchChange}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          disabled={isLoading && activeInputIndex !== index}
          style={{ 
            opacity: (isLoading && activeInputIndex !== index) ? 0.7 : 1
          }}
        />
        
        {localSearchTerm && actorSearchResultsList && actorSearchResultsList.length > 0 && (
          <div className="actor-search-results">
            {actorSearchResultsList.map(actor => (
              <div 
                key={actor.id}
                className="flex items-center p-2 cursor-pointer border-b border-gray-100 text-black hover:bg-gray-300"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectActor(actor.id); // Call with actor.id only
                }}
                tabIndex={0}
              >
                <div className="actor-search-image">
                  <img
                    src={getImageUrlSync(actor.profile_path, 'profile')}
                    alt={actor.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40?text=?';
                    }}
                  />
                </div>
                <div className="actor-search-name">
                  {actor.name}
                </div>
              </div>
            ))}
            
            {actorSearchPageNum < actorSearchTotalPagesNum && (
              <div 
                className="actor-search-item" 
                style={{ justifyContent: 'center', color: '#4a6fa5', fontWeight: 'bold' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onLoadMore(); // Call without arguments
                }}
              >
                Load more results
              </div>
            )}
          </div>
        )}
      </div>
      
      <button 
        className="w-full mt-2 cursor-pointer rounded border-none bg-cyan-600 py-2 px-4 text-white transition-colors duration-300 hover:bg-[#0f3460] disabled:bg-[#cccccc] disabled:cursor-not-allowed"
        onClick={onRandomize} // Call without arguments
        disabled={isLoading && activeInputIndex !== index}
      >
        Random Actor
      </button>
    </>
  );
};

export default ActorSearchInterface;