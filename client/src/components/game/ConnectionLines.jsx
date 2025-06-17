import React from 'react';
import * as ConnectionLinesStyles from '../../styles/connectionPanelStyle.js'; // Import styles

const ConnectionLines = ({ 
  connections, 
  nodePositions,
  connectionRefs,
  boardSize,
  gameCompleted 
}) => {
  return (
    <svg 
      className={ConnectionLinesStyles.connectionsLayerStyle} 
      width={boardSize.width}
      height={boardSize.height}
    >
      {connections.map(connection => {
        const sourceNodeId = connection.source;
        const targetNodeId = connection.target;
        
        const sourcePosition = nodePositions[sourceNodeId];
        const targetPosition = nodePositions[targetNodeId];
        
        if (!sourcePosition || !targetPosition) return null;
        
        // Find the source and target node DOM elements
        const sourceNode = document.getElementById(sourceNodeId);
        const targetNode = document.getElementById(targetNodeId);
        
        // Default position if DOM elements aren't available yet
        let x1 = sourcePosition.x;
        let y1 = sourcePosition.y;
        let x2 = targetPosition.x;
        let y2 = targetPosition.y;
        
        // Calculate center points of the nodes if DOM elements are available
        if (sourceNode && targetNode) {
          const sourceRect = sourceNode.getBoundingClientRect();
          const targetRect = targetNode.getBoundingClientRect();
          
          // Calculate center points
          x1 = sourcePosition.x + (sourceRect.width / 2);
          y1 = sourcePosition.y + (sourceRect.height / 2);
          x2 = targetPosition.x + (targetRect.width / 2);
          y2 = targetPosition.y + (targetRect.height / 2);
        }
        
        // Determine if this is a guest appearance connection
        const isGuestAppearance = connection.isGuestAppearance === true;
        
        // Generate unique connection ID
        const connectionId = `connection-${connection.id}`;
        
        return (
          <line
            key={connectionId}
            ref={el => connectionRefs.current[connectionId] = el}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            style={
              gameCompleted 
                ? ConnectionLinesStyles.connectionLineCompletedStyle 
                : isGuestAppearance 
                  ? ConnectionLinesStyles.connectionLineGuestStyle 
                  : ConnectionLinesStyles.connectionLineBaseStyle
            }
          />
        );
      })}
    </svg>
  );
};

export default ConnectionLines;