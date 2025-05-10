/**
 * useBoard.js
 * 
 * This custom hook manages all aspects of the game board, including nodes, connections,
 * positions, and connectivity logic. It serves as the backbone for the game's core mechanics
 * by handling how entities (actors, movies, TV shows) connect to each other.
 */
import { useState } from 'react';
import { getPersonDetails, getMovieDetails, getTvShowDetails, findPersonGuestAppearances, fetchPopularEntities } from '../services/tmdbService';
import { getItemTitle } from '../utils/stringUtils';
import { DEFAULT_NODE_POSITION, RANDOM_POSITION_RANGE } from '../utils/constants';

/**
 * Custom hook for managing the game board state and operations
 * 
 * This hook encapsulates all the logic related to:
 * - Managing nodes (actors/movies/TV shows) on the board
 * - Handling connections between entities
 * - Tracking node positions
 * - Validating connectability between entities
 * - Adding new entities to the board
 * - Checking for game completion (path between starting actors)
 * 
 * @returns {Object} Board methods and state variables
 */
export const useBoard = () => {
  // State for nodes (actors, movies, TV shows) on the board
  const [nodes, setNodes] = useState([]);
  
  // State for connections between the nodes
  const [connections, setConnections] = useState([]);
  
  // State for tracking the position of each node on the board
  const [nodePositions, setNodePositions] = useState({});
  
  /**
   * Update a node's position on the board after it's been dragged
   * 
   * @param {string} nodeId - ID of node to update (format: "type-id")
   * @param {Object} position - New position coordinates {x, y}
   */
  const updateNodePosition = (nodeId, position) => {
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: position
    }));
  };
  
  /**
   * Check if an item can be connected to existing nodes on the board
   * 
   * For each entity type:
   * - Actors: Check if they were in any movie/show already on the board
   * - Movies: Check if any actor on the board appeared in the movie
   * - TV Shows: Check if any actor on the board appeared in the show
   * 
   * @param {Object} item - Item to check (person, movie, TV)
   * @returns {Promise<boolean>} - Whether the item is connectable to current board
   */
  const checkItemConnectability = async (item) => {
    try {
      // If board is empty, nothing can connect to it
      if (nodes.length === 0) return false;
      
      // Check connectability based on media type
      if (item.media_type === 'person') {
        // For actors: get their filmography and check if they appeared in any movie/show on the board
        const details = await getPersonDetails(item.id);
        const movieCredits = details.movie_credits?.cast || [];
        const tvCredits = details.tv_credits?.cast || [];
        
        // Check if any movie on the board is in this actor's credits
        for (const node of nodes) {
          if (node.type === 'movie') {
            if (movieCredits.some(movie => movie.id === node.data.id)) {
              return true;
            }
          }
          // Check if any TV show on the board is in this actor's credits
          // Includes both regular appearances and guest star appearances
          else if (node.type === 'tv') {
            if (tvCredits.some(tv => tv.id === node.data.id)) {
              return true;
            }
          }
        }
      } 
      else if (item.media_type === 'movie') {
        // For movies: check if any actor on the board appeared in this movie
        const details = await getMovieDetails(item.id);
        const cast = details.credits?.cast || [];
        
        // Check if any actor on the board is in this movie
        for (const node of nodes) {
          if (node.type === 'person') {
            if (cast.some(actor => actor.id === node.data.id)) {
              return true;
            }
          }
        }
      } 
      else if (item.media_type === 'tv') {
        // For TV shows: check if any actor on the board appeared in this show
        const details = await getTvShowDetails(item.id);
        const cast = details.credits?.cast || [];
        
        // Check if any actor on the board is in this TV show's regular cast
        for (const node of nodes) {
          if (node.type === 'person') {
            // First check the regular cast list
            if (cast.some(actor => actor.id === node.data.id)) {
              return true;
            }
            
            // IMPORTANT: Now also check if this TV show appears in the actor's credits
            // This catches guest appearances that might not be in the TV show's regular cast
            const actorTvCredits = node.data.tv_credits?.cast || [];
            if (actorTvCredits.some(credit => credit.id === item.id)) {
              return true;
            }
            
            // Also check the dedicated guest_appearances array if it exists
            const guestAppearances = node.data.guest_appearances || [];
            if (guestAppearances.some(appearance => appearance.id === item.id)) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking item connectability:", error);
      return false;
    }
  };
  
  /**
   * Check if an item can connect with the starting actors
   * 
   * Critical for the initial game state when only starting actors are on the board.
   * For each entity type:
   * - Movies: Check if either starting actor appeared in the movie
   * - TV Shows: Check if either starting actor appeared in the show (regular cast or guest)
   * - Actors: Check if they appeared in any same production as either starting actor
   * 
   * @param {Object} item - Item to check (person, movie, TV)
   * @param {Array} startingActors - The two starting actors
   * @returns {Promise<boolean>} - Whether the item can connect to starting actors
   */
  const checkInitialConnectability = async (item, startingActors) => {
    try {
      // Make sure we have starting actors
      if (!startingActors || startingActors.length === 0) {
        console.error("No starting actors provided to checkInitialConnectability");
        return false;
      }

      // Log to help debug the issue
      console.log(`Checking connectability for ${item.media_type} "${getItemTitle(item)}" with starting actors`);
      
      if (item.media_type === 'movie') {
        const details = await getMovieDetails(item.id);
        const cast = details.credits?.cast || [];
        
        // Check if either of the starting actors is in this movie
        const connected = cast.some(actor => 
          startingActors.some(startActor => startActor && startActor.id === actor.id)
        );
        
        if (connected) {
          console.log(`✅ Movie "${getItemTitle(item)}" is connectable - matching actor found in cast`);
        }
        return connected;
      } 
      else if (item.media_type === 'tv') {
        const details = await getTvShowDetails(item.id);
        const cast = details.credits?.cast || [];
        
        // First check the regular cast
        if (cast.some(actor => 
          startingActors.some(startActor => startActor && startActor.id === actor.id)
        )) {
          console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - actor found in regular cast`);
          return true;
        }
        
        // If not in regular cast, check if either starting actor has this TV show
        // in their TV credits or guest appearances
        for (const startActor of startingActors) {
          if (!startActor) continue;
          
          // Get full actor details if not already loaded
          let actorDetails = startActor;
          if (!startActor.tv_credits || !startActor.tv_credits.cast) {
            actorDetails = await getPersonDetails(startActor.id);
          }
          
          // Check if the actor has TV credits that include this show
          if (actorDetails.tv_credits && actorDetails.tv_credits.cast) {
            if (actorDetails.tv_credits.cast.some(credit => credit.id === item.id)) {
              console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's TV credits`);
              return true;
            }
          }
          
          // Also check specific guest_appearances if available
          if (actorDetails.guest_appearances) {
            if (actorDetails.guest_appearances.some(appearance => appearance.id === item.id)) {
              console.log(`✅ TV Show "${getItemTitle(item)}" is connectable - found in actor's guest appearances`);
              return true;
            }
          }
        }
        
        console.log(`❌ TV Show "${getItemTitle(item)}" is not connectable to starting actors`);
        return false;
      } 
      else if (item.media_type === 'person') {
        // Don't allow adding the starting actors again
        if (startingActors.some(startActor => startActor && startActor.id === item.id)) {
          console.log(`❌ Not allowing readding starting actor`);
          return false;
        }
        
        // Get the searched actor's filmography
        const searchedActorDetails = await getPersonDetails(item.id);
        
        // Extract the movie and TV IDs the searched actor has appeared in
        const searchedActorMovieIds = new Set(
          (searchedActorDetails.movie_credits?.cast || [])
            .map(credit => credit.id)
        );
        const searchedActorTvIds = new Set(
          (searchedActorDetails.tv_credits?.cast || [])
            .map(credit => credit.id)
        );
        
        // Check connections with each starting actor
        for (const startActor of startingActors) {
          if (!startActor) continue;
          
          // Skip if trying to add the starting actor again
          if (item.id === startActor.id) continue;
          
          // Get full actor details if not already loaded
          let startActorDetails = startActor;
          if (!startActor.movie_credits || !startActor.movie_credits.cast) {
            startActorDetails = await getPersonDetails(startActor.id);
          }
          
          // Check if they've been in any of the same movies
          const startActorMovieCredits = startActorDetails.movie_credits?.cast || [];
          for (const credit of startActorMovieCredits) {
            if (searchedActorMovieIds.has(credit.id)) {
              console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in movie ${credit.title || credit.name}`);
              return true;
            }
          }
          
          // Check if they've been in any of the same TV shows
          const startActorTvCredits = startActorDetails.tv_credits?.cast || [];
          for (const credit of startActorTvCredits) {
            if (searchedActorTvIds.has(credit.id)) {
              console.log(`✅ Actor "${getItemTitle(item)}" is connectable - both appeared in TV show ${credit.title || credit.name}`);
              return true;
            }
          }
        }
        
        console.log(`❌ Actor "${getItemTitle(item)}" is not connectable to starting actors`);
        return false;
      }
      
      console.log(`❌ Item type ${item.media_type} not recognized`);
      return false;
    } catch (error) {
      console.error("Error checking initial connectability:", error);
      return false;
    }
  };
  
  /**
   * Add an item to the board and create necessary connections
   * 
   * This function:
   * 1. Validates that the item is connectable
   * 2. Fetches detailed information about the entity
   * 3. Creates a node for the entity
   * 4. Creates connections to other existing nodes
   * 5. Calculates a strategic position for the new node
   * 
   * @param {Object} item - Item to add (person, movie, TV)
   * @param {boolean} exactMatch - Whether it's an exact match (not currently used)
   * @param {Object} connectableItems - Map of connectable items
   * @param {Function} setIsLoading - Function to set loading state
   * @returns {Promise<void>} - Promise that resolves when item is added
   */
  const addToBoard = async (item, exactMatch, connectableItems, setIsLoading) => {
    if (!item) return;

    setIsLoading(true);
    
    try {
      const itemKey = `${item.media_type}-${item.id}`;
      const isConnectable = connectableItems[itemKey];
      
      // Don't allow duplicates on the board
      const existingNode = nodes.find(node => 
        node.id === `${item.media_type}-${item.id}`
      );
      
      if (existingNode) {
        console.log("Item already on board:", getItemTitle(item));
        setIsLoading(false);
        return;
      }
      
      // If we're not forcing addition and the item is not connectable, exit
      if (!isConnectable) {
        console.log("Item not connectable:", getItemTitle(item));
        setIsLoading(false);
        return;
      }
      
      // Process the item by type to add to the board
      let nodeData = null;
      let nodeId = null;
      let nodeType = null;
      let newConnections = [];

      // Process based on media type
      if (item.media_type === 'person') {
        console.log("Adding person to board:", item.name);
        
        // Get person details - fetch with guest appearances included
        const details = await getPersonDetails(item.id);
        
        // Explicitly fetch guest appearances to make sure we have them
        const guestAppearances = await findPersonGuestAppearances(item.id);
        
        // Make sure TV credits include guest appearances
        if (guestAppearances && guestAppearances.length > 0) {
          if (!details.tv_credits) {
            details.tv_credits = { cast: [] };
          }
          
          // Add any guest appearances that aren't already in the TV credits
          const existingTvIds = new Set(details.tv_credits.cast.map(credit => credit.id));
          
          for (const appearance of guestAppearances) {
            if (!existingTvIds.has(appearance.id)) {
              details.tv_credits.cast.push({
                ...appearance,
                is_guest_appearance: true  // Mark as guest appearance
              });
              existingTvIds.add(appearance.id);
            } else {
              // If it's already there, mark it as a guest appearance if it is one
              const existingCredit = details.tv_credits.cast.find(credit => credit.id === appearance.id);
              if (existingCredit && appearance.is_guest_appearance) {
                existingCredit.is_guest_appearance = true;
              }
            }
          }
          
          details.guest_appearances_added = true;
        }
        
        nodeData = details;
        nodeId = `person-${item.id}`;
        nodeType = 'person';
        
        // Get this actor's movie and TV credits
        const movieCredits = details.movie_credits?.cast || [];
        const tvCredits = details.tv_credits?.cast || [];
        
        console.log(`Actor has ${movieCredits.length} movie credits and ${tvCredits.length} TV credits`);
        
        // Check existing nodes for potential connections
        nodes.forEach(existingNode => {
          // Check for connections with movies
          if (existingNode.type === 'movie') {
            const isConnected = movieCredits.some(credit => credit.id === existingNode.data.id);
            if (isConnected) {
              console.log(`Found connection between ${nodeId} and movie ${existingNode.id}`);
              newConnections.push({
                id: `${nodeId}-${existingNode.id}`,
                source: nodeId,
                target: existingNode.id
              });
            }
          } 
          // Check for connections with TV shows
          else if (existingNode.type === 'tv') {
            const creditInfo = tvCredits.find(credit => credit.id === existingNode.data.id);
            const isConnected = !!creditInfo;
            
            if (isConnected) {
              const isGuestAppearance = creditInfo.is_guest_appearance || false;
              console.log(`Found connection between ${nodeId} and TV show ${existingNode.id}`);
              
              newConnections.push({
                id: `${nodeId}-${existingNode.id}`,
                source: nodeId,
                target: existingNode.id,
                isGuestAppearance
              });
            }
          }
        });
        
      } else if (item.media_type === 'movie') {
        console.log("Adding movie to board:", item.title);
        const details = await getMovieDetails(item.id);
        nodeData = details;
        nodeId = `movie-${item.id}`;
        nodeType = 'movie';
        
        // Get the movie's cast
        const cast = details.credits?.cast || [];
        console.log(`Movie has ${cast.length} cast members`);
        
        // Check if any actor on the board is in this movie's cast
        nodes.forEach(existingNode => {
          if (existingNode.type === 'person') {
            const isConnected = cast.some(actor => actor.id === existingNode.data.id);
            if (isConnected) {
              console.log(`Found connection between movie ${nodeId} and actor ${existingNode.id}`);
              newConnections.push({
                id: `${existingNode.id}-${nodeId}`,
                source: existingNode.id,
                target: nodeId
              });
            }
          }
        });
        
      } else if (item.media_type === 'tv') {
        console.log("Adding TV show to board:", item.name);
        const details = await getTvShowDetails(item.id);
        nodeData = details;
        nodeId = `tv-${item.id}`;
        nodeType = 'tv';
        
        // Get the TV show's cast
        const cast = details.credits?.cast || [];
        console.log(`TV show has ${cast.length} cast members`);
        
        // Check for connections with actors on the board
        for (const existingNode of nodes) {
          if (existingNode.type === 'person') {
            const actorId = existingNode.data.id;
            
            // First check regular cast
            const isInRegularCast = cast.some(actor => actor.id === actorId);
            
            if (isInRegularCast) {
              console.log(`Found regular cast connection between TV show ${nodeId} and actor ${existingNode.id}`);
              newConnections.push({
                id: `${existingNode.id}-${nodeId}`,
                source: existingNode.id,
                target: nodeId
              });
            } else {
              // If not in regular cast, check if this actor has this TV show in their credits
              const tvCredits = existingNode.data.tv_credits?.cast || [];
              const creditInfo = tvCredits.find(credit => credit.id === details.id);
              
              if (creditInfo) {
                const isGuestAppearance = creditInfo.is_guest_appearance || false;
                console.log(`Found ${isGuestAppearance ? 'guest appearance' : 'cast'} connection between TV show ${nodeId} and actor ${existingNode.id}`);
                newConnections.push({
                  id: `${existingNode.id}-${nodeId}`,
                  source: existingNode.id,
                  target: nodeId,
                  isGuestAppearance
                });
              }
            }
          }
        }
      }
      
      /**
       * Calculate strategic position for the new node based on connected nodes
       * - If connected to other nodes, position near the average of those nodes
       * - If not connected, position randomly within the board boundaries
       * 
       * @returns {Object} - Position coordinates {x, y}
       */
      const calculateNewNodePosition = () => {
        let newPosition = { ...DEFAULT_NODE_POSITION };
      
        if (newConnections.length > 0) {
          // Find average position of connected nodes
          let sumX = 0;
          let sumY = 0;
          let count = 0;
          
          newConnections.forEach(connection => {
            const connectedNodeId = connection.source === nodeId ? connection.target : connection.source;
            const connectedNodePos = nodePositions[connectedNodeId];
            
            if (connectedNodePos) {
              sumX += connectedNodePos.x;
              sumY += connectedNodePos.y;
              count++;
            }
          });
          
          if (count > 0) {
            // Place the new node near the average position of connected nodes
            return {
              x: (sumX / count) + Math.random() * 100 - 50,
              y: (sumY / count) + Math.random() * 100 - 50
            };
          }
        }
        
        // If no connections, place it in a random position
        return {
          x: RANDOM_POSITION_RANGE.X.MIN + Math.random() * (RANDOM_POSITION_RANGE.X.MAX - RANDOM_POSITION_RANGE.X.MIN),
          y: RANDOM_POSITION_RANGE.Y.MIN + Math.random() * (RANDOM_POSITION_RANGE.Y.MAX - RANDOM_POSITION_RANGE.Y.MIN)
        };
      };
      
      // Add new node to the board
      const newNodePosition = calculateNewNodePosition();
      
      console.log(`Adding node to board: ${nodeId} (${getItemTitle(item)}) at position ${newNodePosition.x},${newNodePosition.y}`);
      
      const newNode = {
        id: nodeId,
        type: nodeType,
        data: nodeData,
        position: newNodePosition
      };
      
      // Add to nodes state
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      // Update node positions
      setNodePositions(prevPositions => ({
        ...prevPositions,
        [nodeId]: newNodePosition
      }));
      
      // Add new connections
      if (newConnections.length > 0) {
        console.log(`Adding ${newConnections.length} connections for ${nodeId}`);
        setConnections(prev => [...prev, ...newConnections]);
      }

      // Save this entity to our local database for future fuzzy searches
      saveEntityToLocalDatabase(item);
      
    } catch (error) {
      console.error("Error adding to board:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Force add an item to the board regardless of connectability
   * 
   * This function bypasses the normal connectability checks, allowing for:
   * - Adding starting actors at the beginning of the game
   * - Adding test/debug entities
   * - Special game modes that allow disconnected entities
   * 
   * @param {Object} item - Item to add (person, movie, TV)
   * @param {Function} setIsLoading - Function to set loading state
   */
  const forceAddToBoard = async (item, setIsLoading) => {
    setIsLoading(true);
    
    try {
      let nodeData;
      let nodeId;
      let nodeType;
      let newConnections = [];
      
      console.log("Force adding item to board:", getItemTitle(item));
      
      // Get detailed information based on item type
      if (item.media_type === 'person') {
        console.log("Adding person to board:", item.name);
        
        // Get person details - fetch with guest appearances included
        const details = await getPersonDetails(item.id);
        
        // Explicitly fetch guest appearances to make sure we have them
        const guestAppearances = await findPersonGuestAppearances(item.id);
        
        // Make sure TV credits include guest appearances
        if (guestAppearances && guestAppearances.length > 0) {
          if (!details.tv_credits) {
            details.tv_credits = { cast: [] };
          }
          
          // Add any guest appearances that aren't already in the TV credits
          const existingTvIds = new Set(details.tv_credits.cast.map(credit => credit.id));
          
          for (const appearance of guestAppearances) {
            if (!existingTvIds.has(appearance.id)) {
              details.tv_credits.cast.push({
                ...appearance,
                is_guest_appearance: true  // Mark as guest appearance
              });
              existingTvIds.add(appearance.id);
            } else {
              // If it's already there, mark it as a guest appearance if it is one
              const existingCredit = details.tv_credits.cast.find(credit => credit.id === appearance.id);
              if (existingCredit && appearance.is_guest_appearance) {
                existingCredit.is_guest_appearance = true;
              }
            }
          }
          
          details.guest_appearances_added = true;
        }
        
        nodeData = details;
        nodeId = `person-${item.id}`;
        nodeType = 'person';
        
        // Get this actor's movie and TV credits
        const movieCredits = details.movie_credits?.cast || [];
        const tvCredits = details.tv_credits?.cast || [];
        
        console.log(`Actor has ${movieCredits.length} movie credits and ${tvCredits.length} TV credits`);
        
        // Check existing nodes for potential connections
        nodes.forEach(existingNode => {
          // Check for connections with movies
          if (existingNode.type === 'movie') {
            const isConnected = movieCredits.some(credit => credit.id === existingNode.data.id);
            if (isConnected) {
              console.log(`Found connection between ${nodeId} and movie ${existingNode.id}`);
              newConnections.push({
                id: `${nodeId}-${existingNode.id}`,
                source: nodeId,
                target: existingNode.id
              });
            }
          } 
          // Check for connections with TV shows - including guest appearances
          else if (existingNode.type === 'tv') {
            // Find the credit information for this TV show
            const creditInfo = tvCredits.find(credit => credit.id === existingNode.data.id);
            const isConnected = !!creditInfo;
            
            if (isConnected) {
              const isGuestAppearance = creditInfo.is_guest_appearance || false;
              
              console.log(`Found connection between ${nodeId} and TV show ${existingNode.id}`);
              if (isGuestAppearance) {
                console.log(`(Guest star appearance)`);
              }
              
              newConnections.push({
                id: `${nodeId}-${existingNode.id}`,
                source: nodeId,
                target: existingNode.id,
                isGuestAppearance: isGuestAppearance
              });
            }
          }
        });
        
      } else if (item.media_type === 'movie') {
        console.log("Adding movie to board:", item.title);
        const details = await getMovieDetails(item.id);
        nodeData = details;
        nodeId = `movie-${item.id}`;
        nodeType = 'movie';
        
        // Get the movie's cast
        const cast = details.credits?.cast || [];
        console.log(`Movie has ${cast.length} cast members`);
        
        // Check if any actor on the board is in this movie's cast
        nodes.forEach(existingNode => {
          if (existingNode.type === 'person') {
            const isConnected = cast.some(actor => actor.id === existingNode.data.id);
            if (isConnected) {
              console.log(`Found connection between movie ${nodeId} and actor ${existingNode.id}`);
              newConnections.push({
                id: `${existingNode.id}-${nodeId}`,
                source: existingNode.id,
                target: nodeId
              });
            }
          }
        });
        
      } else if (item.media_type === 'tv') {
        console.log("Adding TV show to board:", item.name);
        const details = await getTvShowDetails(item.id);
        nodeData = details;
        nodeId = `tv-${item.id}`;
        nodeType = 'tv';
        
        // Get the TV show's cast
        const cast = details.credits?.cast || [];
        console.log(`TV show has ${cast.length} cast members`);
        
        // Check for connections with actors on the board
        // This includes both regular cast and guest star appearances
        let potentialConnections = [];
        
        for (const existingNode of nodes) {
          if (existingNode.type === 'person') {
            const actorId = existingNode.data.id;
            
            // First check regular cast
            const isInRegularCast = cast.some(actor => actor.id === actorId);
            
            if (isInRegularCast) {
              console.log(`Found regular cast connection between TV show ${nodeId} and actor ${existingNode.id}`);
              potentialConnections.push({
                id: `${existingNode.id}-${nodeId}`,
                source: existingNode.id,
                target: nodeId
              });
            } else {
              // If not in regular cast, check if this actor has this TV show in their credits
              // This would pick up guest appearances automatically
              const tvCredits = existingNode.data.tv_credits?.cast || [];
              const creditInfo = tvCredits.find(credit => credit.id === details.id);
              
              if (creditInfo) {
                const isGuestAppearance = creditInfo.is_guest_appearance || false;
                console.log(`Found ${isGuestAppearance ? 'guest appearance' : 'cast'} connection between TV show ${nodeId} and actor ${existingNode.id}`);
                potentialConnections.push({
                  id: `${existingNode.id}-${nodeId}`,
                  source: existingNode.id,
                  target: nodeId,
                  isGuestAppearance: isGuestAppearance
                });
              }
            }
          }
        }
        
        // Add all the connections
        newConnections = [...newConnections, ...potentialConnections];
      }
      
      console.log(`Created ${newConnections.length} new connections`);
      
      // Calculate a position for the new node
      let newPosition = { ...DEFAULT_NODE_POSITION };
      
      if (newConnections.length > 0) {
        // Find average position of connected nodes
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        
        newConnections.forEach(connection => {
          const connectedNodeId = connection.source === nodeId ? connection.target : connection.source;
          const connectedNodePos = nodePositions[connectedNodeId];
          
          if (connectedNodePos) {
            sumX += connectedNodePos.x;
            sumY += connectedNodePos.y;
            count++;
          }
        });
        
        if (count > 0) {
          // Place the new node near the average position of connected nodes
          newPosition = {
            x: (sumX / count) + Math.random() * 100 - 50, // Add some randomness
            y: (sumY / count) + Math.random() * 100 - 50
          };
        }
      } else {
        // If no connections, place it in a random position
        newPosition = {
          x: RANDOM_POSITION_RANGE.X.MIN + Math.random() * (RANDOM_POSITION_RANGE.X.MAX - RANDOM_POSITION_RANGE.X.MIN),
          y: RANDOM_POSITION_RANGE.Y.MIN + Math.random() * (RANDOM_POSITION_RANGE.Y.MAX - RANDOM_POSITION_RANGE.Y.MIN)
        };
      }
      
      console.log(`Adding node to board: ${nodeId} (${getItemTitle(item)}) at position ${newPosition.x},${newPosition.y}`);
      
      // Add new node to the board
      setNodes(prev => [...prev, { id: nodeId, type: nodeType, data: nodeData }]);
      
      // Set position for the new node
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: newPosition
      }));
      
      // Add new connections
      if (newConnections.length > 0) {
        console.log("Adding connections:", newConnections);
        setConnections(prev => [...prev, ...newConnections]);
      }
      
    } catch (error) {
      console.error("Error adding to board:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if a path exists between the starting actors
   * 
   * Uses breadth-first search (BFS) algorithm to find if a path exists
   * between the two starting actors. This is the win condition for the game.
   * 
   * @param {Array} startActors - The starting actors
   * @param {boolean} keepPlayingAfterWin - Whether to keep playing after finding a path
   * @param {function} setGameCompleted - Function to set game completion state
   * @param {function} completeGame - Function to handle game completion and score tracking
   * @param {number} gameStartTime - When the game started (for score calculation)
   * @param {function} setShortestPathLength - Function to set the shortest path length
   * @returns {boolean} - Whether a path was found
   */
  const checkGameCompletion = (
    startActors, 
    keepPlayingAfterWin, 
    setGameCompleted, 
    completeGame, 
    gameStartTime, 
    setShortestPathLength
  ) => {
    // If user chose to keep playing after win, don't show completion again
    if (keepPlayingAfterWin) {
      return false;
    }
    
    // Make sure we have the starting actors and at least some connections
    if (!startActors[0] || !startActors[1] || connections.length === 0) {
      return false;
    }
    
    const startActorId1 = `person-${startActors[0].id}`;
    const startActorId2 = `person-${startActors[1].id}`;
    
    // Verify both actors exist in nodes
    const startActor1Exists = nodes.some(node => node.id === startActorId1);
    const startActor2Exists = nodes.some(node => node.id === startActorId2);
    
    if (!startActor1Exists || !startActor2Exists) {
      console.error("Starting actors not found in nodes array");
      return false;
    }
    
    // Use BFS to check if there's a path between the two actors
    const visited = new Set();
    const queue = [startActorId1];
    const pathNodes = new Map(); // Used to track the path
    
    console.log(`Running path check: from ${startActorId1} to ${startActorId2}`);
    console.log(`Total connections: ${connections.length}`);
    
    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      
      if (currentNodeId === startActorId2) {
        console.log("Path found! Game completed!");
        
        // Calculate the path length (number of connections needed)
        let pathLength = 0;
        let current = startActorId2;
        let shortestPath = [current];
        
        // Walk backwards from target to source to find path length
        while (current !== startActorId1 && pathNodes.has(current)) {
          pathLength++;
          current = pathNodes.get(current);
          shortestPath.unshift(current);
        }
        
        console.log(`Shortest path length: ${pathLength} connections`);
        console.log("Shortest path:", shortestPath);
        
        // Set the shortest path length in the game state
        if (setShortestPathLength) {
          setShortestPathLength(pathLength);
        }
        
        // Calculate score based on path length and time taken
        if (gameStartTime && completeGame) {
          const completionTime = Math.floor((Date.now() - gameStartTime) / 1000); // in seconds
          
          // Calculate final score as time * path length
          // Lower score is better (faster completion with shorter path)
          const finalScore = completionTime * pathLength;
          
          console.log(`Game completed in ${completionTime} seconds with path length ${pathLength}`);
          console.log(`Final score: ${finalScore}`);
          
          // Call completeGame with the final score
          completeGame(finalScore);
        }
        
        setGameCompleted(true);
        return true;
      }
      
      if (visited.has(currentNodeId)) {
        continue; // Skip if already visited
      }
      
      visited.add(currentNodeId);
      
      // Find all connections for the current node
      const nodeConnections = connections.filter(conn => 
        conn.source === currentNodeId || conn.target === currentNodeId
      );
      
      for (const connection of nodeConnections) {
        let nextNodeId = null;
        
        if (connection.source === currentNodeId) {
          nextNodeId = connection.target;
        } else if (connection.target === currentNodeId) {
          nextNodeId = connection.source;
        }
        
        if (nextNodeId && !visited.has(nextNodeId)) {
          queue.push(nextNodeId);
          pathNodes.set(nextNodeId, currentNodeId); // Track parent node for path reconstruction
        }
      }
    }
    
    console.log("No path found between actors");
    return false;
  };

  /**
   * Store entities in local database for faster search
   * 
   * Saves entities that have been added to the board in session storage
   * to allow for faster searching and better suggestions later
   * 
   * @param {Object} entity - Entity to save to local database
   */
  const saveEntityToLocalDatabase = (entity) => {
    if (!entity || !entity.id) return;

    try {
      // Get existing entities from session storage
      const storedEntities = sessionStorage.getItem('popularEntities');
      let entities = storedEntities ? JSON.parse(storedEntities) : [];
      
      // Check if this entity already exists in our database
      const exists = entities.some(e => 
        e.id === entity.id && e.media_type === entity.media_type
      );
      
      if (!exists) {
        // Add the new entity to our database
        entities.push({
          id: entity.id,
          name: entity.name || entity.title || '',
          title: entity.title || entity.name || '',
          profile_path: entity.profile_path,
          poster_path: entity.poster_path,
          media_type: entity.media_type,
          popularity: entity.popularity || 100, // Boost popularity for board items
          known_for_department: entity.known_for_department
        });
        
        // Update session storage
        sessionStorage.setItem('popularEntities', JSON.stringify(entities));
        console.log(`Added ${entity.media_type} "${getItemTitle(entity)}" to local search database`);
      }
    } catch (error) {
      console.error('Error saving entity to local database:', error);
    }
  };

  // Return methods and state variables from the hook
  return {
    nodes,
    setNodes,
    connections,
    setConnections,
    nodePositions,
    setNodePositions,
    updateNodePosition,
    checkItemConnectability,
    checkInitialConnectability,
    addToBoard,
    forceAddToBoard,
    checkGameCompletion
  };
};