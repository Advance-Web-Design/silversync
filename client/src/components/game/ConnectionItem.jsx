import React from 'react';
import { getImageUrlSync } from '../../services/tmdbService';

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
      className={`connection-item ${isOnBoard ? 'already-on-board' : ''} ${isGuestAppearance ? 'guest-appearance' : ''}`}
    >
      <div className="connection-image">
        <img 
          src={getImageUrlSync(imagePath, imageType)} 
          alt={title} 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/60x90?text=No+Image' }}
        />
        {isGuestAppearance && <div className="guest-badge">Guest</div>}
      </div>
      <div className="connection-info">
        <div className="connection-title">{title}</div>
        {character && <div className="connection-detail"><span>as {character}</span></div>}
        {!isOnBoard ? (
          <button 
            className="add-connection-button"
            onClick={() => onAdd(item, mediaType)}
          >
            Add
          </button>
        ) : (
          <div className="on-board-indicator">On Board</div>
        )}
      </div>
    </div>
  );
};

export default ConnectionItem;