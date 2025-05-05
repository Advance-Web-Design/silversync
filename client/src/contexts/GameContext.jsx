/**
 * GameContext.jsx
 * 
 * This file creates and exports the GameContext which serves as the central state management
 * for the "Connect the Stars" game. It combines multiple custom hooks to handle different aspects
 * of the game (board management, searching, game state) and provides this combined state and 
 * functionality to all components via React Context.
 * 
 * The GameContext handles:
 * - Starting actor selection and game initialization
 * - Search functionality for movies, TV shows, and actors
 * - Board state management including connections between entities
 * - Game progression and win state tracking
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchRandomPerson, searchMulti, checkActorInTvShow, fetchPopularEntities, getPersonDetails, getMovieDetails, getTvShowDetails } from '../services/tmdbService';
import { useGame } from '../hooks/useGame';
import { useBoard } from '../hooks/useBoard';
import { useSearch } from '../hooks/useSearch';
import { getItemTitle } from '../utils/stringUtils';

// Create context for game state management
const GameContext = createContext();

// Custom hook for components to access game context
export const useGameContext = () => useContext(GameContext);

/**
 * Main Game Provider component that wraps the application
 * Combines state from multiple custom hooks and provides unified game context
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to context
 */
export const GameProvider = ({ children }) => {
  // Use custom hooks for different aspects of the game
  const gameState = useGame();
  const boardState = useBoard();
  const searchState = useSearch();
  
  // Local state for UI and game interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [possibleConnections, setPossibleConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [showAllSearchable, setShowAllSearchable] = useState(false);
  
  // Destructure state from hooks for easier access
  const {
    isLoading, setIsLoading,
    gameStarted, setGameStarted,
    startActors, setStartActors,
    gameCompleted, setGameCompleted,
    keepPlayingAfterWin, setKeepPlayingAfterWin,
    startActorsError, setStartActorsError,
    actorSearchResults, setActorSearchResults,
    actorSearchTerms, actorSearchPages, actorSearchTotalPages,
    setActorSearchPages, setActorSearchTotalPages,
    selectStartActor, setActorSearch
  } = gameState;
  
  const {
    nodes, setNodes,
    connections, setConnections,
    nodePositions, setNodePositions,
    updateNodePosition: updateNodePositionFromBoard,
    checkItemConnectability,
    checkInitialConnectability,
    addToBoard: addToBoardFn,
    forceAddToBoard: forceAddToBoardFn,
    checkGameCompletion
  } = boardState;
  
  const {
    searchResults, setSearchResults,
    noMatchFound, setNoMatchFound,
    didYouMean, setDidYouMean,
    exactMatch, setExactMatch,
    originalSearchTerm, setOriginalSearchTerm,
    previousSearches, setPreviousSearches,
    knownEntities, setKnownEntities,
    connectableItems, setConnectableItems,
    checkForMisspelling,
    findExactMatch,
    learnFromSuccessfulSearch,
    useSpellingCorrection: useSpellingCorrectionFn,
    searchStartActors: searchStartActorsFn,
    performFuzzySearch,
    addActorTvShowsToConnectableEntities,
    updateConnectableEntitiesForNode
  } = searchState;
  
  /**
   * Wrapper function to update node positions on the board
   * Ensures correct format for DraggableNode component
   * 
   * @param {string} nodeId - ID of the node to update
   * @param {Object} newPosition - New x,y coordinates
   */
  const updateNodePosition = (nodeId, newPosition) => {
    updateNodePositionFromBoard(nodeId, newPosition);
  };
  
  /**
   * Handles selection of a node on the game board
   * Fetches all possible connections for the selected node
   * 
   * @param {Object} node - The selected node object
   */
  const selectNode = async (node) => {
    setSelectedNode(node);
    setIsLoadingConnections(true);
    
    try {
      // Fetch all possible connections for this node
      const connections = await fetchAllPossibleConnections(node);
      setPossibleConnections(connections);
    } catch (error) {
      console.error("Error fetching possible connections:", error);
      setPossibleConnections([]);
    } finally {
      setIsLoadingConnections(false);
    }
  };
  
  /**
   * Fetches all entities that can connect to a given node
   * Based on node type (person/movie/TV), gets relevant connections
   * 
   * @param {Object} node - Node to find connections for
   * @returns {Array} - List of entities that can connect to the node
   */
  const fetchAllPossibleConnections = async (node) => {
    let connections = [];
    
    try {
      if (node.type === 'person') {
        // For an actor, fetch all movies and TV shows they've appeared in
        const credits = await getPersonDetails(node.data.id);
        
        if (credits) {
          // Add movie credits
          if (credits.movie_credits && credits.movie_credits.cast) {
            connections = [...connections, ...credits.movie_credits.cast.map(movie => ({
              ...movie,
              media_type: 'movie'
            }))];
          }
          
          // Add TV credits
          if (credits.tv_credits && credits.tv_credits.cast) {
            connections = [...connections, ...credits.tv_credits.cast.map(tv => ({
              ...tv,
              media_type: 'tv'
            }))];
          }
        }
      } else if (node.type === 'movie') {
        // For a movie, fetch all actors who appeared in it
        const credits = await getMovieDetails(node.data.id);
        
        if (credits && credits.cast) {
          connections = [...connections, ...credits.cast.map(person => ({
            ...person,
            media_type: 'person'
          }))];
        }
      } else if (node.type === 'tv') {
        // For a TV show, fetch all actors who appeared in it
        const credits = await getTvShowDetails(node.data.id);
        
        if (credits && credits.cast) {
          connections = [...connections, ...credits.cast.map(person => ({
            ...person,
            media_type: 'person'
          }))];
        }
      }
      
      // Filter out any items without images for UI quality
      connections = connections.filter(item => {
        if (item.media_type === 'person' && !item.profile_path) return false;
        if ((item.media_type === 'movie' || item.media_type === 'tv') && !item.poster_path) return false;
        return true;
      });
      
      return connections;
    } catch (error) {
      console.error(`Error fetching connections for ${node.type} ${node.data.id}:`, error);
      return [];
    }
  };
  
  /**
   * Closes the connections panel by clearing selected node state
   */
  const closeConnectionsPanel = () => {
    setSelectedNode(null);
    setPossibleConnections([]);
  };
  
  /**
   * Toggles visibility of all searchable entities in the sidebar
   * When enabled, fetches and displays all entities that can connect to the board
   */
  const toggleShowAllSearchable = () => {
    setShowAllSearchable(!showAllSearchable);
    
    // If turning on, fetch all connectable entities
    if (!showAllSearchable) {
      fetchAndSetAllSearchableEntities();
    }
  };
  
  /**
   * Fetches and displays all entities that can be added to the current board
   * Shows different results based on game state (starting phase vs. mid-game)
   */
  const fetchAndSetAllSearchableEntities = async () => {
    setIsLoading(true);
    try {
      // If no nodes on the board yet or only starting actors, don't show any entities 
      // until the user has at least started the game
      if (nodes.length === 0 || !gameStarted) {
        setSearchResults([]);
        return;
      }
      // If only starting actors are on the board, don't automatically show popular entities
      // This prevents showing all movies at the start
      else if (nodes.length <= 2 && startActors.length === 2) {
        // Only show entities if specifically requested through the "Show All" action
        // Don't automatically fetch popular entities
        if (showAllSearchable) {
          const relevantEntities = [];
          
          // Check if we have data for the starting actors
          for (const node of nodes) {
            if (node.type === 'person' && node.data) {
              // For actors, get their movie and TV credits
              if (node.data.movie_credits?.cast) {
                relevantEntities.push(...node.data.movie_credits.cast.map(movie => ({
                  ...movie,
                  media_type: 'movie',
                  source_node: node.id
                })));
              }
              
              if (node.data.tv_credits?.cast) {
                relevantEntities.push(...node.data.tv_credits.cast.map(show => ({
                  ...show,
                  media_type: 'tv',
                  source_node: node.id
                })));
              }
            }
          }
          
          // Filter for images and mark as connectable
          const filteredEntities = relevantEntities.filter(entity => 
            entity && entity.id && ((entity.media_type === 'movie' || entity.media_type === 'tv') && entity.poster_path)
          );
          
          // Mark all these entities as connectable
          const newConnectableItems = {};
          filteredEntities.forEach(item => {
            const itemKey = `${item.media_type}-${item.id}`;
            newConnectableItems[itemKey] = true;
          });
          
          setConnectableItems(prev => ({
            ...prev,
            ...newConnectableItems
          }));
          
          setSearchResults(filteredEntities);
        } else {
          setSearchResults([]);
        }
      } else {
        // With nodes on the board beyond just starting actors, build a list of all connectable entities
        let allConnectableEntities = [];
        
        // Process each node on the board to find its potential connections
        for (const node of nodes) {
          // Skip if node data is incomplete
          if (!node || !node.data || !node.id) continue;
          
          let nodeConnections = [];
          
          // Get connections based on node type
          if (node.type === 'person') {
            // For actors, get their movie and TV credits
            if (node.data.movie_credits?.cast) {
              nodeConnections.push(...node.data.movie_credits.cast.map(movie => ({
                ...movie,
                media_type: 'movie',
                source_node: node.id
              })));
            }
            
            if (node.data.tv_credits?.cast) {
              nodeConnections.push(...node.data.tv_credits.cast.map(show => ({
                ...show,
                media_type: 'tv',
                connection_type: show.is_guest_appearance ? 'guest' : 'cast',
                source_node: node.id
              })));
            }
            
            if (node.data.guest_appearances) {
              nodeConnections.push(...node.data.guest_appearances.map(show => ({
                ...show,
                media_type: 'tv',
                is_guest_appearance: true,
                connection_type: 'guest',
                source_node: node.id
              })));
            }
          } 
          // For movies, get the cast
          else if (node.type === 'movie' && node.data.credits?.cast) {
            nodeConnections.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person',
              source_node: node.id
            })));
          }
          // For TV shows, get the cast
          else if (node.type === 'tv' && node.data.credits?.cast) {
            nodeConnections.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person',
              source_node: node.id
            })));
            
            // Also include guest stars if available
            if (node.data.guest_stars) {
              nodeConnections.push(...node.data.guest_stars.map(actor => ({
                ...actor,
                media_type: 'person',
                is_guest_star: true,
                source_node: node.id
              })));
            }
          }
          
          // Filter connections to only include those with images
          nodeConnections = nodeConnections.filter(item => 
            item && item.id && 
            ((item.media_type === 'person' && item.profile_path) || 
             ((item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path))
          );
          
          allConnectableEntities.push(...nodeConnections);
        }
        
        // Remove duplicates by creating a map keyed by media_type-id
        const uniqueEntitiesMap = new Map();
        allConnectableEntities.forEach(item => {
          const key = `${item.media_type}-${item.id}`;
          uniqueEntitiesMap.set(key, item);
        });
        
        // Filter out entities that are already on the board
        const existingNodeIds = new Set(nodes.map(n => n.id));
        const filteredEntities = Array.from(uniqueEntitiesMap.values()).filter(item => {
          const itemId = `${item.media_type}-${item.id}`;
          return !existingNodeIds.has(itemId);
        });
        
        console.log(`Found ${filteredEntities.length} connectable entities from board nodes`);
        
        // Set filtered entities as search results
        setSearchResults(filteredEntities);
        
        // Mark all these entities as connectable since we know they're connectable
        const newConnectableItems = {};
        filteredEntities.forEach(item => {
          const itemKey = `${item.media_type}-${item.id}`;
          newConnectableItems[itemKey] = true;
        });
        
        setConnectableItems(prev => ({
          ...prev,
          ...newConnectableItems
        }));
      }
    } catch (error) {
      console.error("Error fetching connectable entities:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Fetches a random actor for a starting position
   * Makes multiple attempts if needed to avoid duplicates
   * 
   * @param {number} actorIndex - Index (0 or 1) of the actor position to fill
   */
  const randomizeActors = async (actorIndex) => {
    setIsLoading(true);
    try {
      let randomActor = null;
      let attempts = 0;
      const maxAttempts = 5; // Limit attempts to avoid infinite loop
      
      while (!randomActor && attempts < maxAttempts) {
        const actor = await fetchRandomPerson();
        
        // Check if this actor is already used in the other position
        const otherIndex = actorIndex === 0 ? 1 : 0;
        const otherActor = startActors[otherIndex];
        
        // Only use this actor if it's not the same as the other position
        if (!otherActor || otherActor.id !== actor.id) {
          randomActor = actor;
        } else {
          console.log("Duplicate actor found, trying again...");
          attempts++;
        }
      }
      
      if (randomActor) {
        const newStartActors = [...startActors];
        newStartActors[actorIndex] = randomActor;
        setStartActors(newStartActors);
      } else {
        console.error("Failed to find a unique actor after multiple attempts");
        // Automatically try again after a short delay
        setTimeout(() => randomizeActors(actorIndex), 500);
      }
    } catch (error) {
      console.error("Error fetching random actor:", error);
      // Automatically try again after a short delay
      setTimeout(() => randomizeActors(actorIndex), 500);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Starts the game with the selected starting actors
   * Initializes the board with starting nodes
   */
  const startGame = async () => {
    console.log("StartGame called. Current gameStarted state:", gameStarted);
    setIsLoading(true);
    try {
      console.log("Starting game with actors:", startActors);
      await gameState.startGame(setNodes, setNodePositions);
      console.log("Game started successfully. gameStarted should now be true");
      // Force an update to gameStarted to ensure it's set properly
      setGameStarted(true);
      console.log("Current gameStarted after explicit set:", true);
    } catch (error) {
      console.error("Error starting game:", error);
      console.error("Error details:", error.message, error.stack);
      setStartActorsError("Error starting game. Please try again: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Resets the game to initial state
   * Clears board, connections, and search results
   */
  const resetGame = () => {
    gameState.resetGame(
      setNodes,
      setNodePositions,
      setConnections,
      setSearchResults,
      setConnectableItems
    );
  };
  
  /**
   * Checks if an actor has appeared in a TV show (including guest appearances)
   * Handles different data sources based on whether actor is on board
   * 
   * @param {number} actorId - TMDB ID of the actor
   * @param {number} tvShowId - TMDB ID of the TV show
   * @returns {Promise<boolean>} - Whether actor has appeared in the show
   */
  const checkActorTvShowConnection = async (actorId, tvShowId) => {
    try {
      // First check if the actor is already on the board
      const actorNodeId = `person-${actorId}`;
      const actorNode = nodes.find(node => node.id === actorNodeId);
      
      if (actorNode) {
        // Actor is on board, check their credits directly from node data
        const tvCredits = actorNode.data.tv_credits?.cast || [];
        
        // Check regular cast credits
        if (tvCredits.some(show => show.id === tvShowId)) {
          return true;
        }
        
        // Also check guest appearances if they exist
        const guestAppearances = actorNode.data.guest_appearances || [];
        if (guestAppearances.some(show => show.id === tvShowId)) {
          return true;
        }
        
        // Finally, if the actor has a flag indicating guest appearances were added to tv_credits
        if (actorNode.data.guest_appearances_added) {
          // Do a more thorough check of all tv_credits entries
          return tvCredits.some(show => {
            return show.id === tvShowId || 
                  (show.credit_id && show.credit_id.includes('guest')) ||
                  (show.character && show.character.toLowerCase().includes('guest'));
          });
        }
        
        return false;
      }
      
      // If actor is not on board yet, use the API to check
      const result = await checkActorInTvShow(actorId, tvShowId);
      return result.appears;
    } catch (error) {
      console.error(`Error checking actor-TV connection: ${error}`);
      return false;
    }
  };
  
  /**
   * Main search function for finding movies, TV shows, or actors
   * Handles spell correction and connectability checks
   * 
   * @param {string} term - Search term entered by the user
   */
  const handleSearch = async (term) => {
    if (!term) return;
    
    setOriginalSearchTerm(term);
    setDidYouMean(null);
    setExactMatch(null); // Reset exact match
    setNoMatchFound(false); // Reset no match found state
    setIsLoading(true);
    
    try {
      // First check if there's a string similarity match in our local database
      const similarityMatch = searchState.checkForMisspelling(term);
      let apiSearchTerm = term; // Default to original term
      let similarityMatchFound = false;
      
      // If we found a match in the local database
      if (similarityMatch && typeof similarityMatch === 'object' && similarityMatch.id) {
        const matchTitle = getItemTitle(similarityMatch);
        console.log(`Local database match found: ${matchTitle} (${similarityMatch.media_type})`);
        
        // If the match is different from what the user typed
        if (matchTitle.toLowerCase() !== term.toLowerCase()) {
          setDidYouMean(similarityMatch);
          similarityMatchFound = true;
          
          // Use the exact title/name for our API search to get best results
          apiSearchTerm = matchTitle;
        }
      }
      
      // Search the API using either original term or corrected term from local database
      console.log(`Searching API with term: ${apiSearchTerm} ${similarityMatchFound ? '(from similarity match)' : '(original)'}`);
      let allResults = await searchMulti(apiSearchTerm);
      
      processSearchResults(allResults, term, apiSearchTerm, similarityMatchFound);
    } catch (error) {
      console.error("Error searching:", error);
      setNoMatchFound(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Processes and filters search results from the API
   * Handles exact matches, connectability checks, and spelling suggestions
   * 
   * @param {Array} allResults - Raw search results from API
   * @param {string} originalTerm - Original search term from user
   * @param {string} apiSearchTerm - Term used for API search (may differ after spelling correction)
   * @param {boolean} similarityMatchFound - Whether a spelling correction was already applied
   */
  const processSearchResults = (allResults, originalTerm, apiSearchTerm, similarityMatchFound = false) => {
    // Filter out results without ID or images
    allResults = allResults.filter(item => {
      if (!item.id) return false;
      
      // Check for appropriate image path based on media type
      if (item.media_type === 'person' && !item.profile_path) return false;
      if ((item.media_type === 'movie' || item.media_type === 'tv') && !item.poster_path) return false;
      
      return true;
    });
    
    console.log(`Search for "${apiSearchTerm}" returned ${allResults.length} results`);
    
    // If no results, check for misspellings and exit
    if (allResults.length === 0) {
      // If we didn't already find a similarity match, look again
      if (!similarityMatchFound) {
        // Try again with string-based approach
        const correctedTerm = searchState.checkForMisspelling(originalTerm);
        if (correctedTerm && typeof correctedTerm === 'string' && 
            correctedTerm.toLowerCase() !== originalTerm.toLowerCase()) {
          console.log(`No results for "${originalTerm}", suggesting "${correctedTerm}"`);
          setDidYouMean(correctedTerm);
        } else if (correctedTerm && typeof correctedTerm === 'object' && correctedTerm.id) {
          console.log(`No results for "${originalTerm}", suggesting "${getItemTitle(correctedTerm)}"`);
          setDidYouMean(correctedTerm);
        } else {
          setNoMatchFound(true);
        }
      } else {
        setNoMatchFound(true);
      }
      return;
    }
    
    // Learn from successful search - add to our local database for future searches
    searchState.learnFromSuccessfulSearch(apiSearchTerm, allResults);
    
    // Check if there's an exact match
    const exactMatchItem = searchState.findExactMatch(allResults, apiSearchTerm);
    
    if (exactMatchItem) {
      console.log("FOUND EXACT MATCH:", getItemTitle(exactMatchItem));
      setExactMatch(exactMatchItem);
      
      // Check if this exact match is connectable to the board
      checkExactMatchConnectability(exactMatchItem);
    }
    
    // Process all search results for connectability
    checkSearchResultsConnectability(allResults);
    
    // Set all search results, not just connectable ones
    setSearchResults(allResults);
  };
  
  /**
   * Checks if an exact match from search can connect to the current board
   * Uses different logic based on game state (initial vs. mid-game)
   * 
   * @param {Object} exactMatchItem - The exact match entity from search
   */
  const checkExactMatchConnectability = async (exactMatchItem) => {
    let isConnectable = false;
    
    // For the initial stage with just two starting actors
    if (nodes.length <= 2 && nodes.every(node => node.type === 'person')) {
      isConnectable = await checkInitialConnectability(exactMatchItem, startActors);
      console.log(`Exact match connectable to starting actors: ${isConnectable}`);
    } else {
      // Enhanced: For TV shows, also check for guest appearances
      if (exactMatchItem.media_type === 'tv') {
        // Get all actor nodes on the board
        const actorNodes = nodes.filter(node => node.type === 'person');
        
        // Check if any actor on the board has appeared in this TV show (including guest appearances)
        for (const actorNode of actorNodes) {
          const actorId = actorNode.data.id;
          const hasAppeared = await checkActorTvShowConnection(actorId, exactMatchItem.id);
          
          if (hasAppeared) {
            isConnectable = true;
            break;
          }
        }
      } else {
        isConnectable = await checkItemConnectability(exactMatchItem);
      }
      console.log(`Exact match connectable to board: ${isConnectable}`);
    }
    
    // Mark item as connectable in the state (for UI purposes)
    const itemKey = `${exactMatchItem.media_type}-${exactMatchItem.id}`;
    setConnectableItems(prev => ({
      ...prev,
      [itemKey]: isConnectable // Mark this item as connectable based on check
    }));
  };
  
  /**
   * Checks all search results to determine which ones can connect to the board
   * Updates connectableItems state for UI rendering
   * 
   * @param {Array} allResults - Search results to check for connectability
   */
  const checkSearchResultsConnectability = async (allResults) => {
    let itemConnectability = {};
    
    // For the initial stage of the game with only the two starting actors
    if (nodes.length <= 2 && nodes.every(node => node.type === 'person')) {
      // Process all search results to check connectability
      await Promise.all(allResults.map(async (item) => {
        const canConnect = await checkInitialConnectability(item, startActors);
        const itemKey = `${item.media_type}-${item.id}`;
        itemConnectability[itemKey] = canConnect;
        
        // Add connectable items to our database for fuzzy search
        if (canConnect) {
          searchState.setConnectableEntities(prev => {
            const exists = prev.some(e => e.id === item.id && e.media_type === item.media_type);
            if (!exists) {
              return [...prev, item];
            }
            return prev;
          });
        }
      }));
    } else {
      // Check connectability for each search result in later game stages
      await Promise.all(allResults.map(async (item) => {
        // Enhanced: For TV shows, also check for guest appearances
        let canConnect = false;
        
        if (item.media_type === 'tv') {
          // Get all actor nodes on the board
          const actorNodes = nodes.filter(node => node.type === 'person');
          
          // Check if any actor on the board has appeared in this TV show (including guest appearances)
          for (const actorNode of actorNodes) {
            const actorId = actorNode.data.id;
            const hasAppeared = await checkActorTvShowConnection(actorId, item.id);
            
            if (hasAppeared) {
              canConnect = true;
              break;
            }
          }
        } else {
          canConnect = await checkItemConnectability(item);
        }
        
        const itemKey = `${item.media_type}-${item.id}`;
        itemConnectability[itemKey] = canConnect;
        
        // Add connectable items to our database for fuzzy search
        if (canConnect) {
          searchState.setConnectableEntities(prev => {
            const exists = prev.some(e => e.id === item.id && e.media_type === item.media_type);
            if (!exists) {
              return [...prev, item];
            }
            return prev;
          });
        }
      }));
    }
    
    // Set all connectability states
    setConnectableItems(itemConnectability);
  };
  
  /**
   * Adds a selected item to the game board
   * Handles special cases for TV shows with guest appearances
   * Updates connectable entities after addition
   * 
   * @param {Object} item - Entity to add to the board
   */
  const addToBoard = async (item) => {
    // For TV shows, check for guest appearances
    if (item.media_type === 'tv') {
      const enhancedItem = {
        ...item,
        // Make sure these flags are preserved to identify guest appearances
        hasGuestAppearances: item.hasGuestAppearances || item.is_guest_appearance || false,
        is_guest_appearance: item.is_guest_appearance || false
      };
      await addToBoardFn(enhancedItem, exactMatch, connectableItems, setIsLoading);
    } else {
      await addToBoardFn(item, exactMatch, connectableItems, setIsLoading);
    }
    
    // After adding an item to the board, fetch all its potential connections
    // and add them to our connectable entities list
    const nodeId = `${item.media_type}-${item.id}`;
    const nodeAdded = nodes.find(n => n.id === nodeId);
    
    if (nodeAdded) {
      // Define a function to fetch possible connections for the node
      const fetchNodeConnections = async (node) => {
        let connections = [];
        
        try {
          // If node is a person, we could connect to their movies and TV shows
          if (node.type === 'person') {
            // Movie credits
            if (node.data.movie_credits?.cast) {
              connections.push(...node.data.movie_credits.cast.map(movie => ({
                ...movie,
                media_type: 'movie'
              })));
            }
            
            // TV credits - make sure to include all TV shows including guest appearances
            if (node.data.tv_credits?.cast) {
              connections.push(...node.data.tv_credits.cast.map(show => ({
                ...show,
                media_type: 'tv',
                connection_type: show.is_guest_appearance ? 'guest' : 'cast',
                from_actor_id: node.data.id,
                from_actor_name: node.data.name
              })));
            }
            
            // Explicitly include guest appearances
            if (node.data.guest_appearances) {
              connections.push(...node.data.guest_appearances.map(show => ({
                ...show,
                media_type: 'tv',
                is_guest_appearance: true,
                connection_type: 'guest',
                from_actor_id: node.data.id,
                from_actor_name: node.data.name
              })));
            }

            // If we have access to the actor's complete details, use the addActorTvShowsToConnectableEntities helper
            if (searchState.addActorTvShowsToConnectableEntities && node.data) {
              const actorTvShows = searchState.addActorTvShowsToConnectableEntities(node.data);
              if (actorTvShows && actorTvShows.length > 0) {
                // Add shows from the helper, avoiding duplicates
                const existingIds = new Set(connections.filter(c => c.media_type === 'tv').map(c => c.id));
                const newTvShows = actorTvShows.filter(show => !existingIds.has(show.id));
                connections.push(...newTvShows);
              }
            }
          }
          // If node is a movie, we could connect to its cast
          else if (node.type === 'movie' && node.data.credits?.cast) {
            connections.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person'
            })));
          }
          // If node is a TV show, we could connect to its cast
          else if (node.type === 'tv' && node.data.credits?.cast) {
            connections.push(...node.data.credits.cast.map(actor => ({
              ...actor,
              media_type: 'person'
            })));
            
            // Also add guest stars if available
            if (node.data.guest_stars) {
              connections.push(...node.data.guest_stars.map(actor => ({
                ...actor,
                media_type: 'person',
                is_guest_star: true
              })));
            }
          }
        } catch (error) {
          console.error("Error fetching node connections:", error);
        }
        
        // Filter out connections without necessary data
        return connections.filter(conn => 
          conn && conn.id && 
          ((conn.media_type === 'person' && conn.profile_path) || 
           ((conn.media_type === 'movie' || conn.media_type === 'tv') && conn.poster_path))
        );
      };
      
      // Update the connectable entities list
      await searchState.updateConnectableEntitiesForNode(nodeAdded, fetchNodeConnections);
      
      // If the sidebar is currently showing all searchable entities, refresh the list
      if (showAllSearchable) {
        // Short delay to allow the node to be fully added to the board
        setTimeout(() => {
          fetchAndSetAllSearchableEntities();
        }, 300);
      }
    }
  };
  
  /**
   * Wrapper for using spelling correction suggestions
   * Applies the suggested correction and performs a new search
   */
  const useSpellingCorrection = async () => {
    useSpellingCorrectionFn(handleSearch);
  };
  
  /**
   * Wrapper for searching start actors
   * Handles pagination and loading state
   * 
   * @param {string} query - Actor name to search for
   * @param {number} actorIndex - Index position (0 or 1)
   * @param {number} page - Page number for pagination
   */
  const searchStartActors = async (query, actorIndex, page = 1) => {
    searchStartActorsFn(
      query,
      actorIndex,
      page,
      setActorSearchResults,
      setActorSearchPages,
      setActorSearchTotalPages,
      setIsLoading
    );
  };
  
  /**
   * Effect to check for game completion when nodes or connections change
   * Validates if starting actors are connected and updates game state
   */
  useEffect(() => {
    if (nodes.length > 0 && connections.length > 0) {
      checkGameCompletion(
        startActors, 
        keepPlayingAfterWin, 
        setGameCompleted, 
        gameState.completeGame, 
        gameState.gameStartTime,
        gameState.setShortestPathLength
      );
    }
  }, [nodes, connections, startActors, keepPlayingAfterWin, gameState.gameStartTime]);

  /**
   * Effect to initialize spell checking database with popular entities
   * Runs once when component mounts
   */
  useEffect(() => {
    const initPopularEntities = async () => {
      try {
        await fetchPopularEntities();
        console.log('Popular entities database initialized for spell checking');
      } catch (error) {
        console.error('Failed to initialize popular entities database:', error);
      }
    };
    
    initPopularEntities();
  }, []);

  return (
    <GameContext.Provider
      value={{
        isLoading,
        gameStarted,
        gameStartTime: gameState.gameStartTime,
        startActors,
        nodes,
        nodePositions,
        connections,
        searchResults,
        setSearchResults, // Add this to expose setSearchResults
        searchTerm,
        gameCompleted,
        keepPlayingAfterWin,
        setKeepPlayingAfterWin,
        connectableItems,
        didYouMean,
        originalSearchTerm,
        setSearchTerm,
        randomizeActors,
        startGame,
        handleSearch,
        addToBoard,
        updateNodePosition, // Fixed: Using the wrapper function
        resetGame,
        useSpellingCorrection,
        noMatchFound,
        actorSearchResults,
        actorSearchTerms,
        searchStartActors,
        setActorSearch,
        selectStartActor,
        actorSearchPages,
        actorSearchTotalPages,
        startActorsError,
        checkActorTvShowConnection,
        selectedNode,
        selectNode,
        closeConnectionsPanel,
        completeGame: gameState.completeGame,
        bestScore: gameState.bestScore,
        shortestPathLength: gameState.shortestPathLength,
        possibleConnections, // Add this to expose possibleConnections
        isLoadingConnections, // Add this to expose isLoadingConnections
        showAllSearchable, // Add this to expose showAllSearchable
        toggleShowAllSearchable // Add this to expose toggleShowAllSearchable
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;