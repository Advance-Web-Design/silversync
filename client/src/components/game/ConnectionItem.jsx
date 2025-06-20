import React from 'react';
import { getImageUrl } from '../../utils/tmdbUtils';
import { useTheme } from '../../contexts/ThemeContext';
import * as connectionItemStyles from '../../styles/connectionPanelStyle.js';

/**
 * ConnectionItem - Renders a single connection item (movie, TV show, or actor)
 * with appropriate styling and interactive elements
 */
const ConnectionItem = ({ 
  item, 
  mediaType, 
  isOnBoard, 
  isGuestAppearance, 
  onAdd 
}) => {
  // Determine image type based on media type
  const imageType = mediaType === 'person' ? 'profile' : 'poster';
  const imagePath = item.poster_path || item.profile_path;
  
  // Get appropriate title based on type
  const title = mediaType === 'person' ? item.name : 
                mediaType === 'movie' ? item.title : item.name;
                
  // Get character info if applicable
  const character = item.character || (item.roles && item.roles.length > 0 ? item.roles[0].character : null);
  
  const { isLightMode } = useTheme();
  return (
    <div
      className={
        connectionItemStyles.connectionItemBaseStyle + " " +
        (isLightMode ? connectionItemStyles.connectionItemLightStyle : connectionItemStyles.connectionItemDarkStyle) + " " +
        (isOnBoard? (isLightMode ? connectionItemStyles.alreadyOnBoardLightStyle : connectionItemStyles.alreadyOnBoardDarkStyle): ""
        ) + " " +(isGuestAppearance ? connectionItemStyles.connectionItemGuestAppearanceStyle : "")
      }
    >
      <div className={connectionItemStyles.connectionImageStyle}>
        <img 
          className={connectionItemStyles.connectionImageImgStyle}
          src={getImageUrl(imagePath, imageType)} 
          alt={title} 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
        />
        {isGuestAppearance && <div className={connectionItemStyles.guestBadgeStyle}>Guest</div>}
      </div>
      <div className={connectionItemStyles.connectionInfoStyle}>
        <div className={connectionItemStyles.connectionTitleStyle}>{title}</div>
        {character && <div className={connectionItemStyles.connectionDetailBaseStyle + " "+ (isLightMode? connectionItemStyles.connectionDetailLightStyle : connectionItemStyles.connectionDetailDarkStyle)}>
        <span>as {character}</span></div>}
        {!isOnBoard ? (
          <button 
            className={connectionItemStyles.addConnectionButtonStyle}
            onClick={() => onAdd(item, mediaType)}
          >
            Add
          </button>
        ) : (
          <div className={connectionItemStyles.onBoardIndicatorBaseStyle + " "+ (isLightMode? connectionItemStyles.onBoardIndicatorLightStyle : connectionItemStyles.onBoardIndicatorDarkStyle)}>On Board</div>
        )}
      </div>
    </div>
  );
};

export default ConnectionItem;