import React from 'react';
import { getImageUrlSync } from '../../services/tmdbService';
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
  
  return (
    <div 
      className={`${connectionItemStyles.connectionItemStyle} ${isOnBoard ? connectionItemStyles.alreadyOnBoardStyle : ''} ${isGuestAppearance ? connectionItemStyles.guestAppearanceStyle : ''}`}
    >
      <div className={connectionItemStyles.connectionImageStyle}>
        <img 
          className={connectionItemStyles.connectionImageImgStyle}
          src={getImageUrlSync(imagePath, imageType)} 
          alt={title} 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
        />
        {isGuestAppearance && <div className={connectionItemStyles.guestBadgeStyle}>Guest</div>}
      </div>
      <div className={connectionItemStyles.connectionInfoStyle}>
        <div className={connectionItemStyles.connectionTitleStyle}>{title}</div>
        {character && <div className={connectionItemStyles.connectionDetailStyle}><span>as {character}</span></div>}
        {!isOnBoard ? (
          <button 
            className={connectionItemStyles.addConnectionButtonStyle}
            onClick={() => onAdd(item, mediaType)}
          >
            Add
          </button>
        ) : (
          <div className={connectionItemStyles.onBoardIndicatorStyle}>On Board</div>
        )}
      </div>
    </div>
  );
};

export default ConnectionItem;