import React from 'react';
import ConnectionItem from './ConnectionItem';

/**
 * ConnectionSection - Renders a section of connections with a title and grid of items
 */
const ConnectionSection = ({ 
  title, 
  items, 
  mediaType, 
  isItemOnBoard, 
  handleAddToBoard, 
  determineGuestStatus 
}) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="connection-section">
      <h3>{title} ({items.length})</h3>
      <div className="connections-grid">
        {items.map((item, index) => {
          // Determine if this is a guest appearance
          const isGuest = determineGuestStatus ? 
            determineGuestStatus(item) : 
            item.isGuestAppearance;
          
          return (
            <ConnectionItem
              key={`${mediaType}-${item.id}-${item.credit_id || item.order || index}`}
              item={item}
              mediaType={mediaType}
              isOnBoard={isItemOnBoard(item, mediaType)}
              isGuestAppearance={isGuest}
              onAdd={handleAddToBoard}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionSection;