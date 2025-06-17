/**
 * DraggableNode.jsx
 * 
 * This component represents an interactive node in the game board that can be:
 * - Dragged around the board (mouse and touch support)
 * - Double-clicked/tapped to show its connections
 * - Visually styled based on entity type (person, movie, TV show)
 * 
 * Each node displays:
 * - An image (poster for movies/TV shows or profile for actors)
 * - A title/name
 * - A type badge
 * - Special highlighting for starting actors
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { getImageUrlSync } from '../../services/tmdbService';
import { getItemTitle } from '../../utils/stringUtils';
import { useGameContext } from '../../contexts/gameContext';
import * as NodeStyles from '../../styles/NodeStyles.js'; // Import the styles

const DraggableNode = ({ node, position, updatePosition, boardWidth, boardHeight, isStartActor, zoomLevel }) => {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Get the selectNode function from context to handle node selection
  const { selectNode } = useGameContext();
  
  // Determine the appropriate image type and URL based on node type
  const imageType = node.type === 'person' ? 'profile' : 'poster';
  const imageUrl = node.data?.poster_path || node.data?.profile_path 
    ? getImageUrlSync(node.data.poster_path || node.data.profile_path, imageType)
    : null;
  
  // Get the display title for the node
  const title = getItemTitle(node.data);
  
  /**
   * Handles mouse down events to start dragging or detect double clicks
   * @param {MouseEvent} e - Mouse event
   */
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Only handle left clicks
    
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // Check for double click (less than 300ms between clicks)
    if (timeSinceLastClick < 300) {
      e.preventDefault();
      e.stopPropagation();
      
      // Handle double-click - show connections panel
      selectNode(node);
      return;
    }
    
    // Update last click time for potential double-click detection
    setLastClickTime(currentTime);
    
    // Calculate offset based on the element's actual position and mouse position
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setIsDragging(true);
    
    e.preventDefault();
    e.stopPropagation();
    
    // This makes sure the node always appears on top when dragging
    if (nodeRef.current) {
      nodeRef.current.style.zIndex = "1000";
    }
  }, [node, lastClickTime, selectNode]);
  
  /**
   * Handles mouse movement during dragging to update node position
   * @param {MouseEvent} e - Mouse event
   */
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse position and initial offset
    const effectiveZoom = zoomLevel || 1; /*sanity check to prevent division by 0 */
    const newX = (e.clientX - dragOffset.x) / effectiveZoom;
    const newY = (e.clientY - dragOffset.y) / effectiveZoom;
    updatePosition({ x: newX, y: newY });
    
    // Calculate boundaries considering node dimensions
    const nodeWidth = nodeRef.current ? nodeRef.current.offsetWidth : 0;
    const nodeHeight = nodeRef.current ? nodeRef.current.offsetHeight : 0;
    
    // Check if board dimensions are valid numbers
    const validBoardWidth = typeof boardWidth === 'number' && boardWidth > 0 ? boardWidth : window.innerWidth;
    const validBoardHeight = typeof boardHeight === 'number' && boardHeight > 0 ? boardHeight : window.innerHeight;
    
    // Keep node within board boundaries
    const boundedX = Math.max(0, Math.min(newX, validBoardWidth - nodeWidth));
    const boundedY = Math.max(0, Math.min(newY, validBoardHeight - nodeHeight));
    
    updatePosition({ x: boundedX, y: boundedY });
    
    e.preventDefault();
  }, [isDragging, dragOffset, updatePosition, boardWidth, boardHeight]);
  
  /**
   * Handles mouse up events to end dragging
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // Reset z-index back to normal when done dragging
      if (nodeRef.current) {
        nodeRef.current.style.zIndex = "";
      }
    }
  }, [isDragging]);
  
  /**
   * Handles touch start events for mobile dragging and double-tap detection
   * @param {TouchEvent} e - Touch event
   */
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // Check for double tap
    if (timeSinceLastClick < 300) {
      e.preventDefault();
      
      // Handle double-tap - show connections panel
      selectNode(node);
      return;
    }
    
    // Update last click time for potential double-tap detection
    setLastClickTime(currentTime);
    
    // Calculate offset based on the element's actual position and touch position
    const rect = nodeRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    
    setIsDragging(true);
    
    // Set higher z-index for dragging
    if (nodeRef.current) {
      nodeRef.current.style.zIndex = "1000";
    }
  }, [node, lastClickTime, selectNode]);
  
  /**
   * Handles touch movement during dragging to update node position on mobile
   * @param {TouchEvent} e - Touch event
   */
  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    
    // Calculate new position based on touch position and initial offset
    const effectiveZoom = zoomLevel || 1; /*sanity check to prevent division by 0 */
    const newX = (touch.clientX - dragOffset.x) / effectiveZoom;
    const newY = (touch.clientY - dragOffset.y) / effectiveZoom;
    updatePosition({ x: newX, y: newY });
    
    // Calculate boundaries considering node dimensions
    const nodeWidth = nodeRef.current ? nodeRef.current.offsetWidth : 0;
    const nodeHeight = nodeRef.current ? nodeRef.current.offsetHeight : 0;
    
    // Check if board dimensions are valid numbers
    const validBoardWidth = typeof boardWidth === 'number' && boardWidth > 0 ? boardWidth : window.innerWidth;
    const validBoardHeight = typeof boardHeight === 'number' && boardHeight > 0 ? boardHeight : window.innerHeight;
    
    // Keep node within board boundaries
    const boundedX = Math.max(0, Math.min(newX, validBoardWidth - nodeWidth));
    const boundedY = Math.max(0, Math.min(newY, validBoardHeight - nodeHeight));
    
    updatePosition({ x: boundedX, y: boundedY });
    
    e.preventDefault();
  }, [isDragging, dragOffset, updatePosition, boardWidth, boardHeight]);
  
  /**
   * Handles touch end events to stop dragging on mobile
   */
  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // Reset z-index back to normal
      if (nodeRef.current) {
        nodeRef.current.style.zIndex = "";
      }
    }
  }, [isDragging]);
  
  /**
   * Set up and clean up event listeners for mouse and touch interactions
   */
  useEffect(() => {
    if (!nodeRef.current) return;
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  
  /**
   * Determine background color based on node type
   * @returns {string} CSS color value
   */
  const getNodeColor = () => {
    switch(node.type) {
      case 'person':
        return 'rgba(118, 120, 245, 0.9)'; // Blue for actors
      case 'movie':
        return 'rgba(201, 176, 55, 0.9)'; // Old Gold for movies
      case 'tv':
        return 'rgba(215, 215, 215, 0.9)'; // Silver for TV shows
      default:
        return 'rgba(200, 200, 200, 0.9)';
    }
  };
  
  const nodeBorderColor = getNodeColor();
  
  // Construct className dynamically
  const nodeClassName = `
    ${NodeStyles.draggableNodeBaseStyle}
    ${isDragging ? `${NodeStyles.draggingTransitionOverrideStyle} ${NodeStyles.draggingNodeStyle}` : ""}
    ${isStartActor ? NodeStyles.startActorNodeStyle : ""}
    ${node.type}-node 
  `.replace(/\s+/g, ' ').trim(); // Clean up extra spaces

  return (
    <div id={node.id}
      ref={nodeRef} 
      className={nodeClassName}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        borderColor: isStartActor ? 'gold' : nodeBorderColor,
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={NodeStyles.nodeContentWrapperStyle}>
        <div className={NodeStyles.nodeImageContainerStyle}>
          {imageUrl ? ( <img src={imageUrl} alt={title} className={NodeStyles.nodeImageStyle} draggable="false" />
          ) : ( <div className={NodeStyles.nodeImageFallbackStyle}> 
                  {title.substring(0, 2)}
                </div>
          )}
          
         
        </div>
      </div>
    </div>
  );
};

export default DraggableNode;