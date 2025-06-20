import React from 'react';
import { getItemTitle } from '../../utils/stringUtils';
import { getItemYear } from '../../utils/stringUtils';
import * as PanelStyles from '../../styles/PanelUIStyle.js';
import { useTheme } from '../../contexts/ThemeContext';


const SearchPanelUI = ({
  handleSubmit,
  inputRef,
  searchTerm = "", // Add default value here
  handleInputChange,
  isLoading,
  hasResults,
  noMatchFound,
  originalSearchTerm,
  shouldShowResults,
  resultsContainerRef,
  organizedResults,
  connectableItems,
  handleAddToBoard,
}) => {
  const { isLightMode } = useTheme();

  return (
    <div
      className={
        PanelStyles.panelUIbaseStyle + " " +
        (isLightMode ? PanelStyles.panelUiLightStyle : PanelStyles.panelUiDarkStyle) + " " +
        (hasResults ? PanelStyles.panelUIWithResultsStyle : "")
      }
    >
      <form onSubmit={handleSubmit} className={PanelStyles.searchFormBaseStyle + " " + (isLightMode ? PanelStyles.searchFormLightStyle : PanelStyles.searchFormDarkStyle)}>
        <input
          ref={inputRef}
          className={PanelStyles.searchInputBaseStyle + " " + (isLightMode ? PanelStyles.searchInputLightStyle : PanelStyles.searchInputDarkStyle)}
          type="text"
          placeholder="Search movies, TV shows, actors..."
          value={searchTerm || ""} // Add fallback here too
          onChange={handleInputChange}
          autoFocus
        />
        <button
          type="submit"
          className={`${PanelStyles.searchButtonStyle}`}
          disabled={isLoading || !searchTerm?.trim()} // Add optional chaining
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {/* No Results Message */}
      {noMatchFound && (
        <div className={`${PanelStyles.searchNoResultsStyle}`}>
          <p>No matches found for "{originalSearchTerm}"</p>
          <p style={{ fontSize: 'smaller' }}>Try a different search term or check your spelling.</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className={`${PanelStyles.searchLoadingStyle}`}>
          Searching...
        </div>
      )}
      
      {/* Search Results - only show if we have search term and results */}
      {shouldShowResults && (
        <div className={`${PanelStyles.searchResultsStyle}`} ref={resultsContainerRef}>
          {organizedResults.connectable.map(item => (
            <div
              key={`${item.media_type}-${item.id}`}
              // className={`in-game-result-item ${connectableItems[`${item.media_type}-${item.id}`] ? 'can-connect' : ''}`}
              className={
              PanelStyles.resultItemBaseStyle + " " +
              (isLightMode ? PanelStyles.resultItemLightStyle : PanelStyles.resultItemDarkStyle) + " " +
              (connectableItems[`${item.media_type}-${item.id}`] ? PanelStyles.resultItemCanConnectStyle : "") + " " +
              (item.is_exact_match ? PanelStyles.resultItemExactMatchStyle : "")}              
              onClick={() => handleAddToBoard(item)}
            >
              <div className={`${PanelStyles.resultImageStyle}`}>
                <img
                  className={`${PanelStyles.resultImageImgStyle}`}
                  src={`https://image.tmdb.org/t/p/w92${item.media_type === 'person' ? item.profile_path : item.poster_path}`}
                  alt={getItemTitle(item)}
                />
              </div>
              <div className={`${PanelStyles.resultInfoStyle}`}>
                <div className={`${PanelStyles.resultTitleStyle}`}>{getItemTitle(item) + " " + getItemYear(item)} </div>
                <div className={`${PanelStyles.resultTypeStyle} ${isLightMode ? PanelStyles.resultTypeLightStyle : PanelStyles.resultTypeDarkStyle}`}>
                  {item.media_type === 'movie' ? 'Movie' : item.media_type === 'tv' ? 'TV Show' : 'Actor'}
                  {/* Show guest appearance tag if applicable */}
                  {item.media_type === 'tv' && (item.is_guest_appearance || item.hasGuestAppearances) && 
                    <span style={{ color: '#FFC107' }}> (Guest)</span>
                  }
                  {item.media_type === 'person' && item.is_guest_star && 
                    <span style={{ color: '#FFC107' }}> (Guest)</span>
                  }
                </div>
              </div>
              <button 
                className={PanelStyles.addButtonBaseStyle + " " +
                (isLightMode ? PanelStyles.addButtonLightStyle : PanelStyles.addButtonDarkStyle)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToBoard(item);
                }}
              >
                Add
              </button>
            </div>
          ))}
          
          {/* Show message if no connectable items */}
          {organizedResults.connectable.length === 0 && organizedResults.notConnectable.length > 0 && (
            <div className={`${PanelStyles.searchNoResultsStyle}`}>
              <p>Found matches, but none can be connected to the board.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPanelUI;