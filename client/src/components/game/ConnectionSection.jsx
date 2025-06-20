import React from 'react';
import ConnectionItem from './ConnectionItem';
import * as sectionStyles from '../../styles/connectionPanelStyle.js';
import { useTheme } from '../../contexts/ThemeContext';

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

  const { isLightMode } = useTheme();

  return (
    <div className={`${sectionStyles.connectionSectionStyle} ${sectionStyles[mediaType]}`}>
      <h3 className={sectionStyles.connectionSectionH3BaseStyle + " " +
        (isLightMode ? sectionStyles.connectionSectionH3LightStyle : sectionStyles.connectionSectionH3DarkStyle)}>
      {title} ({items.length})</h3>
      <div className={sectionStyles.connectionsGridStyle}>
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