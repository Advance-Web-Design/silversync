import React from 'react';
import { useGameContext } from '../../contexts/gameContext';
import { getItemTitle } from '../../utils/stringUtils';
import * as SidebarStyles from '../../styles/SearchSIderbar.js'; // Import the styles

const SearchEntitiesSidebar = React.memo(({ isOpen, onClose }) => {
  const { 
    nodes, 
    cheatSheetResults,
    isLoading, 
    showAllSearchable, 
    toggleShowAllSearchable, 
    addToBoard,
    connectableItems
  } = useGameContext();

  const connectableEntities = React.useMemo(() => {
    if (!cheatSheetResults || !connectableItems) return [];
    return cheatSheetResults.filter(item => {
      const itemKey = `${item.media_type}-${item.id}`;
      return connectableItems[itemKey];
    });
  }, [cheatSheetResults, connectableItems]);

  const groupedEntities = React.useMemo(() => {
    const groups = {
      person: [],
      movie: [],
      tv: []
    };
    
    connectableEntities.forEach(item => {
      if (groups[item.media_type]) {
        groups[item.media_type].push(item);
      }
    });
    
    groups.person.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    groups.movie.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    groups.tv.sort((a, b) => getItemTitle(a).localeCompare(getItemTitle(b)));
    
    return groups;
  }, [connectableEntities]);

  if (!isOpen) return null;

  if (!showAllSearchable && (!cheatSheetResults || cheatSheetResults.length === 0)) {
    return null;
  }

  const handleAddToBoard = (item) => {
    addToBoard(item);
  };

  const handleClose = () => {
    toggleShowAllSearchable();
    onClose();
  };

  const getConnectedNodes = (item) => {
    if (item.source_node) {
      const sourceNode = nodes.find(node => node.id === item.source_node);
      if (sourceNode) return [sourceNode];
    }
    const connectedNodesList = [];
    if (item.media_type === 'person') {
      const movieNodes = nodes.filter(node => node.type === 'movie');
      movieNodes.forEach(movieNode => {
        const cast = movieNode.data.credits?.cast || [];
        if (cast.some(actor => actor.id === item.id)) connectedNodesList.push(movieNode);
      });
      const tvNodes = nodes.filter(node => node.type === 'tv');
      tvNodes.forEach(tvNode => {
        const cast = tvNode.data.credits?.cast || [];
        const guestStars = tvNode.data.guest_stars || [];
        if (cast.some(actor => actor.id === item.id) || guestStars.some(actor => actor.id === item.id)) {
          connectedNodesList.push(tvNode);
        }
      });
    } else if (item.media_type === 'movie' || item.media_type === 'tv') {
      const actorNodes = nodes.filter(node => node.type === 'person');
      actorNodes.forEach(actorNode => {
        if (item.media_type === 'movie' && actorNode.data.movie_credits?.cast) {
          if (actorNode.data.movie_credits.cast.some(movie => movie.id === item.id)) connectedNodesList.push(actorNode);
        } else if (item.media_type === 'tv') {
          const hasRegularAppearance = actorNode.data.tv_credits?.cast?.some(show => show.id === item.id);
          const hasGuestAppearance = actorNode.data.guest_appearances?.some(show => show.id === item.id);
          if (hasRegularAppearance || hasGuestAppearance) connectedNodesList.push(actorNode);
        }
      });
    }
    return connectedNodesList;
  };

  const renderEntitySection = (title, entities, mediaType) => {
    if (entities.length === 0) return null;
    let h4Style = SidebarStyles.entityTypeSectionH4BaseStyle;
    if (mediaType === 'person') h4Style = SidebarStyles.entityTypeSectionH4PersonStyle;
    if (mediaType === 'movie') h4Style = SidebarStyles.entityTypeSectionH4MovieStyle;
    if (mediaType === 'tv') h4Style = SidebarStyles.entityTypeSectionH4TvStyle;

    return (
      <div className={SidebarStyles.entityTypeSectionStyle}>
        <h4 className={h4Style}>{title} ({entities.length})</h4>
        <div className={SidebarStyles.searchEntitiesListStyle}>
          {entities.map(item => {
            const connectedNodes = getConnectedNodes(item);
            const imagePath = item.media_type === 'person' ? item.profile_path : item.poster_path;
            return (
              <div
                key={`${item.media_type}-${item.id}`}
                className={SidebarStyles.searchEntityItemStyle}
                onClick={() => handleAddToBoard(item)}
              >
                <div className={SidebarStyles.searchEntityImageStyle}>
                  <img
                    src={`https://image.tmdb.org/t/p/w92${imagePath}`}
                    alt={getItemTitle(item)}
                    className={SidebarStyles.searchEntityImageImgStyle}
                  />
                </div>
                <div className={SidebarStyles.searchEntityInfoStyle}>
                  <div className={SidebarStyles.searchEntityTitleStyle}>{getItemTitle(item)}</div>
                  <div className={SidebarStyles.searchEntityTypeStyle}>
                    {mediaType === 'person' ? 'Actor' : mediaType === 'movie' ? 'Movie' : 'TV Show'}
                    {(item.is_guest_star || item.is_guest_appearance || item.hasGuestAppearances) && 
                      <span className={SidebarStyles.guestTagStyle}> (Guest)</span>
                    }
                  </div>
                  {connectedNodes.length > 0 && (
                    <div className={SidebarStyles.sourceNodeIndicatorStyle}>
                      Connects with: {connectedNodes.map(node => getItemTitle(node.data)).join(', ')}
                    </div>
                  )}
                </div>
                <button 
                  className={SidebarStyles.addToBoardButtonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToBoard(item);
                  }}
                >
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={SidebarStyles.sidebarOverlayStyle} onClick={handleClose}>
      <div className={SidebarStyles.sidebarStyle} onClick={(e) => e.stopPropagation()}>
        <div className={SidebarStyles.sidebarHeaderStyle}>
          <h3 className={SidebarStyles.sidebarHeaderH3Style}>Connectable Entities</h3>
          <button className={SidebarStyles.closeBtnStyle} onClick={handleClose}>×</button>
        </div>
        <div className={SidebarStyles.sidebarContentStyle}>
          {isLoading ? (
            <div className={SidebarStyles.searchEntitiesLoadingStyle}>Loading connectable entities...</div>
          ) : (
            <>
              {connectableEntities.length > 0 ? (
                <>
                  {renderEntitySection("Actors", groupedEntities.person, "person")}
                  {renderEntitySection("Movies", groupedEntities.movie, "movie")}
                  {renderEntitySection("TV Shows", groupedEntities.tv, "tv")}
                </>
              ) : (
                <div className={SidebarStyles.noEntitiesMessageStyle}>
                  <p className={SidebarStyles.noEntitiesMessagePStyle}>No connectable entities available.</p>
                  <p className={SidebarStyles.noEntitiesMessagePStyle}>There are no movies, TV shows, or actors that can be connected to the board at this moment.</p>
                </div>
              )}
            </>
          )}        
        </div>      
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === false && nextProps.isOpen === false;
});

export default SearchEntitiesSidebar;