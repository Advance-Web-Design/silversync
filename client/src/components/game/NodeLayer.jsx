import React from 'react';
import { Box } from '@mui/material';
import DraggableNode from './DraggableNode';

const NodeLayer = ({ 
  nodes, 
  nodePositions, 
  updateNodePosition, 
  boardSize, 
  startActors,
  zoomLevel
}) => {
  return (
    <Box className="nodes-container">
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
      })}
    </Box>
  );
};

export default NodeLayer;