import React from 'react';
import { getImageUrlSync } from '../../services/tmdbService';
import * as actorInterfaceStyles from '../../styles/ActorsCardStyle.js'; 
import { useTheme } from '../../contexts/ThemeContext';

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
  const { isLightMode } = useTheme();
  return (
    <>
      <div className={actorInterfaceStyles.loadingActorsStyle}>
        {isLoading && activeInputIndex !== index ? 'Loading...' : 'Select an actor'}
      </div>
      
      <div className={actorInterfaceStyles.actorSearchPanelStyle}>
        <input
          ref={searchInputRef}
          type="text"
          className={actorInterfaceStyles.actorSearchInputStyle}
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
          <div className={actorInterfaceStyles.actorSearchResultsStyle}>
            {actorSearchResultsList.map(actor => (
              <div 
                key={actor.id}
                className={actorInterfaceStyles.actorSearchResultItemStyle}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectActor(actor.id); // Call with actor.id only
                }}
                tabIndex={0}
              >
                <div className={actorInterfaceStyles.actorSearchImageStyle}>
                  <img
                    className={actorInterfaceStyles.actorSearchImageImgStyle}
                    src={getImageUrlSync(actor.profile_path, 'profile')}
                    alt={actor.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40?text=?';
                    }}
                  />
                </div>
                <div className={actorInterfaceStyles.actorSearchNameStyle}>
                  {actor.name}
                </div>
              </div>
            ))}
            
            {actorSearchPageNum < actorSearchTotalPagesNum && (
              <div 
                className={actorInterfaceStyles.actorSearchItemStyle}
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
        className={actorInterfaceStyles.randomButtonBaseStyle + " " +
          (isLightMode ? actorInterfaceStyles.randomButtonLightStyle : actorInterfaceStyles.randomButtonDarkStyle)}
        onClick={onRandomize} // Call without arguments
        disabled={isLoading && activeInputIndex !== index}
      >
        Random Actor
      </button>
    </>
  );
};

export default ActorSearchInterface;