import React from 'react';
import { Box } from '@mui/material';
import DraggableNode from './DraggableNode';

const NodeLayer = React.memo(({ 
  nodes, 
  nodePositions, 
  updateNodePosition, 
  boardSize, 
  startActors,
  zoomLevel
}) => {
  return (
    <Box>
      {nodes.map(node => {
        // Check if this node is one of the starting actors
        const isStartActor = startActors.some(actor => 
          `person-${actor.id}` === node.id
        );
        
        return (
          <DraggableNode
            key={node.id}
            node={node}
            position={nodePositions[node.id] || { x: 0, y: 0 }}
            updatePosition={(position) => updateNodePosition(node.id, position)}
            boardWidth={boardSize.width}
            boardHeight={boardSize.height}
            isStartActor={isStartActor}
            zoomLevel={zoomLevel} /* zoom level */
          />
        );
      })}    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for NodeLayer
  return (
    prevProps.nodes.length === nextProps.nodes.length &&
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.boardSize.width === nextProps.boardSize.width &&
    prevProps.boardSize.height === nextProps.boardSize.height &&
    JSON.stringify(prevProps.nodePositions) === JSON.stringify(nextProps.nodePositions) &&
    JSON.stringify(prevProps.startActors) === JSON.stringify(nextProps.startActors)
  );
});

export default NodeLayer;