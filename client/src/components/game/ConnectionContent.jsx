import React from 'react';
import ConnectionSection from './ConnectionSection';
import * as contentStyle from '../../styles/connectionPanelStyle.js'; // Adjust the import path as necessary

/**
 * ConnectionsContent - Renders different connection sections based on the type of node
 * Contains all the conditional rendering logic for different types of connections
 */
const ConnectionContent = ({
  nodeType,
  connections,
  isItemOnBoard,
  handleAddToBoard,
  isGuestStar
}) => {
  return (
    <div className={contentStyle.connectionsContentStyle}>
      {nodeType === 'person' && (
        <>
          <ConnectionSection
            title="Movies"
            items={connections.movies}
            mediaType="movie"
            isItemOnBoard={isItemOnBoard}
            handleAddToBoard={handleAddToBoard}
          />
          
          <ConnectionSection
            title="TV Shows"
            items={connections.tvShows}
            mediaType="tv"
            isItemOnBoard={isItemOnBoard}
            handleAddToBoard={handleAddToBoard}
          />
        </>
      )}
      
      {(nodeType === 'movie' || nodeType === 'tv') && (
        <ConnectionSection
          title={`Cast ${nodeType === 'tv' ? '(including Guest Stars)' : ''}`}
          items={connections.cast}
          mediaType="person"
          isItemOnBoard={isItemOnBoard}
          handleAddToBoard={handleAddToBoard}
          determineGuestStatus={isGuestStar}
        />
      )}
      
      {/* Empty state message */}
      {Object.values(connections).every(arr => !arr || arr.length === 0) && (
        <div className={contentStyle.noConnectionsMessageStyle}>
          No connections found for this {
            nodeType === 'person' ? 'actor' : 
            nodeType === 'movie' ? 'movie' : 'TV show'
          }.
        </div>
      )}
    </div>
  );
};

export default ConnectionContent;